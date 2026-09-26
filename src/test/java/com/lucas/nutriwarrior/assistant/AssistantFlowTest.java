package com.lucas.nutriwarrior.assistant;

import com.lucas.nutriwarrior.assistant.command.WaterCommand;
import com.lucas.nutriwarrior.assistant.extractor.WaterCommandExtractor;
import com.lucas.nutriwarrior.model.entity.Cliente;
import com.lucas.nutriwarrior.model.entity.Role;
import com.lucas.nutriwarrior.model.entity.Usuario;
import com.lucas.nutriwarrior.repository.ClienteRepository;
import com.lucas.nutriwarrior.repository.DiaRegistroRepository;
import com.lucas.nutriwarrior.repository.RefeicaoRepository;
import com.lucas.nutriwarrior.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Import(com.lucas.nutriwarrior.config.TestAssistantConfig.class)
class AssistantFlowTest {

    @Autowired
    private AssistantIntentClassifier classifier;

    @Autowired
    private WaterCommandExtractor waterExtractor;

    @Autowired
    private AssistantService assistantService;

    @Autowired
    private PendingActionStore pendingActions;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private DiaRegistroRepository diaRegistroRepository;

    @Autowired
    private RefeicaoRepository refeicaoRepository;

    @Test
    void shouldClassifyWaterIntentAndExtractQuantity() {
        AssistantIntent intent = classifier.classify("Bebi 500 ml de água");
        assertEquals(AssistantIntent.REGISTRAR_AGUA, intent);

        WaterCommand command = waterExtractor.extract("Bebi 500 ml de água");
        assertEquals(500, command.quantidadeMl());
    }

    @Test
    void shouldClarifyMealWithoutQuantity() {
        Cliente cliente = createPatientWithClient();
        long mealsBefore = refeicaoRepository.count();
        assertEquals(AssistantIntent.REGISTRAR_REFEICAO, classifier.classify("Comi arroz e frango"));

        var result = assistantService.chat("Comi arroz e frango", cliente.id, cliente.usuario);

        assertEquals(AssistantIntent.CLARIFY, result.intent());
        assertFalse(result.confirmationRequired());
        assertNull(result.confirmationId());
        assertEquals(mealsBefore, refeicaoRepository.count());
    }

    @Test
    void shouldRequestConfirmationBeforePersistingWriteAction() {
        Cliente cliente = createPatientWithClient();

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("user", "pass", java.util.List.of())
        );

        var result = assistantService.chat("Bebi mais meio litro", cliente.id, cliente.usuario);

        assertTrue(result.confirmationRequired());
        assertNotNull(result.confirmationId());
        assertEquals(AssistantIntent.REGISTRAR_AGUA, result.intent());
        assertTrue(diaRegistroRepository.findByCliente_IdAndData(
            cliente.id, LocalDate.now(ZoneId.of("America/Sao_Paulo"))).isEmpty());
    }

    @Test
    void executeRejectsAnotherUserAndRevalidatesPatientLink() {
        Cliente owner = createPatientWithClient();
        Cliente other = createPatientWithClient();
        var pending = assistantService.chat("Bebi 500 ml", null, owner.usuario);
        var forbidden = assertThrows(org.springframework.web.server.ResponseStatusException.class,
            () -> assistantService.execute(pending.confirmationId(), other.usuario));
        assertEquals(403, forbidden.getStatusCode().value());
        assertFalse(pendingActions.require(pending.confirmationId()).consumed());
        var mismatched = pendingActions.create(new PendingAction(null, owner.usuario.id, other.id,
            AssistantIntent.REGISTRAR_AGUA, java.util.Map.of("quantidadeMl", 500), null, null, false));
        assertEquals(403, assertThrows(org.springframework.web.server.ResponseStatusException.class,
            () -> assistantService.execute(mismatched.id(), owner.usuario)).getStatusCode().value());
        assertFalse(pendingActions.require(mismatched.id()).consumed());
    }

    @Test
    void failedMealExecutionRollsBackMeal() {
        Cliente owner = createPatientWithClient();
        var pending = pendingActions.create(new PendingAction(null, owner.usuario.id, owner.id,
            AssistantIntent.REGISTRAR_REFEICAO, java.util.Map.of(
                "tipoRefeicao", com.lucas.nutriwarrior.model.entity.TipoRefeicao.ALMOCO,
                "itens", java.util.List.of(new com.lucas.nutriwarrior.assistant.command.MealCommand.Item(
                    "missing-food-" + UUID.randomUUID(), java.math.BigDecimal.TEN))), null, null, false));
        var day = new com.lucas.nutriwarrior.model.entity.DiaRegistro();
        day.cliente = owner;
        day.data = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        day.aguaMl = 0;
        diaRegistroRepository.save(day);
        long mealsBefore = refeicaoRepository.count();
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(owner.usuario.email, null, java.util.List.of()));
        try {
            assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> assistantService.execute(pending.id(), owner.usuario));
            assertEquals(mealsBefore, refeicaoRepository.count());
            assertTrue(diaRegistroRepository.findByCliente_IdAndData(owner.id,
                LocalDate.now(ZoneId.of("America/Sao_Paulo"))).isPresent());
        } finally { SecurityContextHolder.clearContext(); }
    }

    private Cliente createPatientWithClient() {
        Usuario usuario = new Usuario();
        usuario.nome = "Paciente de teste";
        usuario.email = "assistant-test-" + UUID.randomUUID() + "@example.com";
        usuario.senhaHash = "unused-in-test";
        usuario.role = Role.PACIENTE;
        usuario.ativo = true;
        usuario.createdAt = Instant.now();
        usuarioRepository.save(usuario);

        Cliente cliente = new Cliente();
        cliente.nome = usuario.nome;
        cliente.usuario = usuario;
        return clienteRepository.save(cliente);
    }
}
