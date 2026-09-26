package com.lucas.nutriwarrior.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucas.nutriwarrior.assistant.command.MealCommand;
import com.lucas.nutriwarrior.config.TestAssistantConfig;
import com.lucas.nutriwarrior.model.entity.*;
import com.lucas.nutriwarrior.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestAssistantConfig.class)
class JpaPendingActionStoreTest {
    @Autowired PendingActionStore store;
    @Autowired PendingActionRepository repository;
    @Autowired PendingActionPayloadCodec codec;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired UsuarioRepository usuarios;
    @Autowired ClienteRepository clientes;
    @Autowired DiaRegistroRepository dias;
    @Autowired RefeicaoRepository refeicoes;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    private Usuario owner;
    private Cliente cliente;

    @BeforeEach
    void setupOwner() {
        owner = new Usuario();
        owner.nome = "Persistent assistant test";
        owner.email = "pending-" + UUID.randomUUID() + "@example.com";
        owner.senhaHash = passwordEncoder.encode("senhaSegura123");
        owner.role = Role.PACIENTE;
        owner.ativo = true;
        owner.createdAt = Instant.now();
        usuarios.saveAndFlush(owner);
        cliente = new Cliente();
        cliente.nome = owner.nome;
        cliente.usuario = owner;
        clientes.saveAndFlush(cliente);
    }

    private PendingAction action(AssistantIntent intent, Map<String, Object> payload) {
        return new PendingAction(null, owner.id, cliente.id, intent, payload, null, null, false);
    }

    private PendingAction water() {
        return store.create(action(AssistantIntent.REGISTRAR_AGUA, Map.of("quantidadeMl", 500)));
    }

    private PendingActionStore independentStore() {
        ProxyFactory proxy = new ProxyFactory(new JpaPendingActionStore(repository, codec));
        var interceptor = new TransactionInterceptor();
        interceptor.setTransactionManager(transactionManager);
        interceptor.setTransactionAttributeSource(new AnnotationTransactionAttributeSource());
        proxy.addAdvice(interceptor);
        return (PendingActionStore) proxy.getProxy();
    }

    @Test
    void committedActionsCanBeReadByNewStoreWithTypedPayloads() throws Exception {
        var cases = List.of(
            action(AssistantIntent.REGISTRAR_AGUA, Map.of("quantidadeMl", 500)),
            action(AssistantIntent.REGISTRAR_PESO, Map.of("pesoKg", new BigDecimal("74.30"))),
            action(AssistantIntent.REGISTRAR_REFEICAO, Map.of("tipoRefeicao", TipoRefeicao.ALMOCO,
                "itens", List.of(new MealCommand.Item("arroz", new BigDecimal("150.5"))))));
        for (var input : cases) {
            var created = store.create(input);
            var loaded = independentStore().require(created.id());
            assertEquals(input.payload(), loaded.payload());
            assertEquals(input.intent(), loaded.intent());
            assertEquals(owner.id, loaded.userId());
            assertEquals(cliente.id, loaded.clienteId());
            assertEquals(input.createdAt().getEpochSecond(), loaded.createdAt().getEpochSecond());
            assertEquals(600, loaded.expiresAt().getEpochSecond() - loaded.createdAt().getEpochSecond());
            assertEquals(4, UUID.fromString(loaded.id()).version());
            assertFalse(loaded.consumed());
        }
        try (var connection = Objects.requireNonNull(jdbc.getDataSource()).getConnection()) {
            assertEquals("H2", connection.getMetaData().getDatabaseProductName());
        }
    }

    @Test
    void expiredActionIsRejectedWithoutConsumption() {
        Instant expiry = Instant.now().minusSeconds(1);
        var input = action(AssistantIntent.REGISTRAR_AGUA, Map.of("quantidadeMl", 500));
        var expired = store.create(new PendingAction(input.id(), owner.id, cliente.id, input.intent(),
            input.payload(), expiry.minusSeconds(600), expiry, false));
        assertStatus(400, () -> store.require(expired.id()));
        assertStatus(400, () -> store.consume(expired.id(), owner.id));
        assertNull(repository.findById(expired.id()).orElseThrow().consumedAt);
    }

    @Test
    void consumedActionCannotBeUsedAgain() {
        var pending = water();
        assertTrue(store.consume(pending.id(), owner.id).consumed());
        assertNotNull(repository.findById(pending.id()).orElseThrow().consumedAt);
        assertStatus(409, () -> independentStore().consume(pending.id(), owner.id));
        assertStatus(409, () -> store.require(pending.id()));
    }

    @Test
    void foreignUserCannotConsumeAction() {
        var pending = water();
        assertStatus(403, () -> store.consume(pending.id(), owner.id + 100000));
        assertFalse(store.require(pending.id()).consumed());
    }

    @Test
    void missingActionProducesControlledError() {
        String id = UUID.randomUUID().toString();
        assertStatus(404, () -> store.require(id));
        assertStatus(404, () -> store.consume(id, owner.id));
    }

    @Test
    void invalidAndCorruptedPayloadsAreRejectedBeforeConsumption() {
        for (String invalid : List.of("not-json", "null", "{}", "[]", "{} {}",
                "{\"quantidadeMl\":-1}", "{\"quantidadeMl\":1.5}", "{\"quantidadeMl\":\"500\"}",
                "{\"pesoKg\":75}", "{\"quantidadeMl\":500,\"userId\":999}",
                "{\"quantidadeMl\":500,\"thinking\":\"private\"}")) {
            var pending = water();
            jdbc.update("update assistant_pending_action set payload_json = ? where id = ?", invalid, pending.id());
            assertStatus(400, () -> store.require(pending.id()));
            assertStatus(400, () -> store.consume(pending.id(), owner.id));
            assertNull(repository.findById(pending.id()).orElseThrow().consumedAt);
        }
        var invalidMeal = water();
        jdbc.update("update assistant_pending_action set intent = ?, payload_json = ? where id = ?",
            "REGISTRAR_REFEICAO", "{\"tipoRefeicao\":0,\"itens\":[{\"alimento\":\"arroz\",\"quantidadeGramas\":100}]}", invalidMeal.id());
        assertStatus(400, () -> store.consume(invalidMeal.id(), owner.id));
        assertNull(repository.findById(invalidMeal.id()).orElseThrow().consumedAt);
        var pending = water();
        jdbc.update("update assistant_pending_action set intent = ? where id = ?", "UNKNOWN", pending.id());
        assertStatus(400, () -> store.require(pending.id()));
        assertStatus(400, () -> store.consume(pending.id(), owner.id));
        long count = repository.count();
        assertStatus(400, () -> store.create(action(AssistantIntent.REGISTRAR_PESO, Map.of("pesoKg", -1))));
        assertStatus(400, () -> store.create(action(AssistantIntent.OUT_OF_SCOPE, Map.of())));
        assertStatus(400, () -> store.create(action(AssistantIntent.REGISTRAR_REFEICAO,
            Map.of("tipoRefeicao", TipoRefeicao.ALMOCO, "itens", List.of(new MealCommand.Item("arroz", BigDecimal.ZERO))))));
        assertEquals(count, repository.count());
    }

    @Test
    void duplicateIdCannotOverwriteConsumedAction() {
        var pending = water();
        store.consume(pending.id(), owner.id);
        assertThrows(DataIntegrityViolationException.class, () -> store.create(pending));
        assertStatus(409, () -> store.require(pending.id()));
    }

    @Test
    void independentStoresConsumeConcurrentlyWithExactlyOneSuccess() throws Exception {
        var pending = water();
        var stores = List.of(independentStore(), independentStore());
        var ready = new CountDownLatch(8);
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(8)) {
            List<Future<Boolean>> results = new ArrayList<>();
            for (int i = 0; i < 8; i++) {
                PendingActionStore instance = stores.get(i % 2);
                results.add(executor.submit(() -> {
                    instance.require(pending.id());
                    ready.countDown();
                    if (!start.await(10, TimeUnit.SECONDS)) throw new AssertionError("Start barrier timed out");
                    try { instance.consume(pending.id(), owner.id); return true; }
                    catch (ResponseStatusException exception) {
                        assertEquals(409, exception.getStatusCode().value());
                        return false;
                    }
                }));
            }
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            int successes = 0;
            for (var result : results) if (result.get(15, TimeUnit.SECONDS)) successes++;
            assertEquals(1, successes);
            assertNotNull(repository.findById(pending.id()).orElseThrow().consumedAt);
        } finally { start.countDown(); }
    }

    @Test
    void consumptionSurvivesOuterTransactionRollback() {
        var pending = water();
        assertThrows(IllegalStateException.class, () -> new TransactionTemplate(transactionManager).execute(status -> {
            store.require(pending.id());
            store.consume(pending.id(), owner.id);
            throw new IllegalStateException("Simulated domain failure");
        }));
        assertStatus(409, () -> independentStore().consume(pending.id(), owner.id));
    }

    @Test
    void chatPersistsActionAndExecuteWritesExactlyOnceThroughHttp() throws Exception {
        String token = login();
        String response = mvc.perform(post("/assistant/chat").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"message\":\"Bebi 500 ml\"}"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String id = mapper.readTree(response).get("confirmationId").asText();
        assertTrue(repository.existsById(id));
        assertTrue(dias.findByCliente_IdAndData(cliente.id, today()).isEmpty());
        execute(token, id, 200);
        execute(token, id, 409);
        assertEquals(500, dias.findByCliente_IdAndData(cliente.id, today()).orElseThrow().aguaMl);
        assertNotNull(repository.findById(id).orElseThrow().consumedAt);
    }

    @Test
    void failedDomainExecutionRollsBackMealButKeepsConfirmationConsumed() throws Exception {
        DiaRegistro day = new DiaRegistro();
        day.cliente = cliente;
        day.data = today();
        day.aguaMl = 0;
        dias.saveAndFlush(day);
        var pending = store.create(action(AssistantIntent.REGISTRAR_REFEICAO,
            Map.of("tipoRefeicao", TipoRefeicao.ALMOCO,
                "itens", List.of(new MealCommand.Item("missing-" + UUID.randomUUID(), BigDecimal.TEN)))));
        long before = refeicoes.count();
        String token = login();
        execute(token, pending.id(), 400);
        assertEquals(before, refeicoes.count());
        assertNotNull(repository.findById(pending.id()).orElseThrow().consumedAt);
        execute(token, pending.id(), 409);
    }

    private String login() throws Exception {
        String response = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", owner.email, "senha", "senhaSegura123"))))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return "Bearer " + mapper.readTree(response).get("accessToken").asText();
    }

    private void execute(String token, String id, int expectedStatus) throws Exception {
        mvc.perform(post("/assistant/execute").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("confirmationId", id))))
            .andExpect(status().is(expectedStatus));
    }

    private LocalDate today() { return LocalDate.now(ZoneId.of("America/Sao_Paulo")); }

    private void assertStatus(int expected, org.junit.jupiter.api.function.Executable operation) {
        var exception = assertThrows(ResponseStatusException.class, operation);
        assertEquals(expected, exception.getStatusCode().value());
        assertNull(exception.getCause());
    }
}
