package com.lucas.nutriwarrior.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucas.nutriwarrior.assistant.command.MealCommand;
import com.lucas.nutriwarrior.model.entity.TipoRefeicao;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.net.InetSocketAddress;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

class AssistantHardeningTest {
    private PendingAction action(Instant expiry) {
        return new PendingAction(null, 1L, 2L, AssistantIntent.REGISTRAR_AGUA,
            Map.of("quantidadeMl", 500), null, expiry, false);
    }

    @Test
    void confirmationIsSingleUseEvenConcurrently() throws Exception {
        var store = new InMemoryPendingActionStore();
        var action = store.create(action(null));
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(12)) {
            List<Future<Boolean>> results = new ArrayList<>();
            for (int i = 0; i < 12; i++) {
                results.add(executor.submit(() -> {
                    start.await();
                    try { store.consume(action.id(), 1L); return true; }
                    catch (ResponseStatusException e) { assertEquals(409, e.getStatusCode().value()); return false; }
                }));
            }
            start.countDown();
            int successes = 0;
            for (var result : results) if (result.get(5, TimeUnit.SECONDS)) successes++;
            assertEquals(1, successes);
        }
    }

    @Test
    void foreignUserCannotConsumeAndExpiryIsEnforced() {
        var store = new InMemoryPendingActionStore();
        var action = store.create(action(null));
        assertEquals(4, UUID.fromString(action.id()).version());
        assertEquals(2L, action.clienteId());
        assertEquals(600, action.expiresAt().getEpochSecond() - action.createdAt().getEpochSecond());
        assertEquals(403, assertThrows(ResponseStatusException.class,
            () -> store.consume(action.id(), 9L)).getStatusCode().value());
        assertTrue(store.consume(action.id(), 1L).consumed());
        var expired = store.create(action(Instant.now().minusSeconds(1)));
        assertEquals(400, assertThrows(ResponseStatusException.class,
            () -> store.consume(expired.id(), 1L)).getStatusCode().value());
    }

    @Test
    void mealRejectsMixedValidInvalidAndNullItems() {
        var valid = new MealCommand.Item("arroz", BigDecimal.TEN);
        assertFalse(new MealCommand(TipoRefeicao.ALMOCO,
            List.of(valid, new MealCommand.Item("frango", BigDecimal.ZERO))).isValid());
        assertFalse(new MealCommand(TipoRefeicao.ALMOCO, Arrays.asList(valid, null)).isValid());
    }

    @Test
    void ollamaUsesConfigurationAndDiscardsThinking() throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var received = new CompletableFuture<String>();
        server.createContext("/api/chat", exchange -> {
            received.complete(new String(exchange.getRequestBody().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8));
            byte[] body = "{\"message\":{\"content\":\"{\\\"quantidadeMl\\\":500}\",\"thinking\":\"PRIVATE\",\"reasoning\":\"PRIVATE\"}}".getBytes();
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            var properties = new OllamaProperties();
            properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
            properties.setModel("test-model"); properties.setKeepAlive("3m");
            var result = new OllamaClient(properties).chatStructured("system", "user", Water.class, "WaterExtraction");
            assertEquals(500, result.quantidadeMl());
            var request = new ObjectMapper().readTree(received.get(5, TimeUnit.SECONDS));
            assertEquals("test-model", request.path("model").asText());
            assertEquals("3m", request.path("keep_alive").asText());
            assertFalse(request.path("think").asBoolean());
            assertEquals(0, request.path("options").path("temperature").asDouble());
            assertEquals("object", request.path("format").path("type").asText());
            assertTrue(request.path("format").path("properties").has("quantidadeMl"));
        } finally { server.stop(0); }
    }

    @Test
    void unavailableOllamaIsNotHiddenByClassifierFallback() {
        LlmClient unavailable = (system, user) -> { throw new ResponseStatusException(
            org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "Indisponivel"); };
        var classifier = new AssistantIntentClassifier(unavailable, new PromptLoader());
        assertEquals(503, assertThrows(ResponseStatusException.class,
            () -> classifier.classify("Bebi 500 ml")).getStatusCode().value());
    }

    @Test
    void timeoutInvalidJsonAndInlineThinkingAreControlled() throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        var content = new java.util.concurrent.atomic.AtomicReference<>("invalid");
        server.createContext("/api/chat", exchange -> {
            exchange.getRequestBody().readAllBytes();
            if (content.get().equals("timeout")) {
                try { Thread.sleep(1600); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
            byte[] body = new ObjectMapper().writeValueAsBytes(Map.of("message", Map.of("content", content.get())));
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            try {
                exchange.sendResponseHeaders(200, body.length);
                exchange.getResponseBody().write(body);
            } finally { exchange.close(); }
        });
        server.start();
        var properties = new OllamaProperties();
        properties.setTimeoutSeconds(1);
        properties.setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
        var client = new OllamaClient(properties);
        try {
            for (String invalid : List.of("invalid", "{\"quantidadeMl\":{}}", "{\"quantidadeMl\":1.5}", "{} {}")) {
                content.set(invalid);
                var error = assertThrows(InvalidLlmResponseException.class,
                    () -> client.chatStructured("system", "user", Water.class, "WaterExtraction"));
                assertNull(error.getCause());
            }
            content.set("<think>PRIVATE</think>answer");
            assertEquals(503, assertThrows(ResponseStatusException.class,
                () -> client.chat("system", "user")).getStatusCode().value());
            content.set("timeout");
            assertEquals(503, assertThrows(ResponseStatusException.class,
                () -> client.chat("system", "user")).getStatusCode().value());
        } finally { server.stop(0); }
        assertEquals(503, assertThrows(ResponseStatusException.class,
            () -> client.chat("system", "user")).getStatusCode().value());
    }
    @Test
    void fallbackDoesNotTurnNegativeOrOverflowingWaterIntoValidQuantity() {
        LlmClient malformed = (system, user) -> "invalid";
        var extractor = new com.lucas.nutriwarrior.assistant.extractor.WaterCommandExtractor(malformed, new PromptLoader());
        for (String message : List.of("-500 ml", "-0.5 litro", "999999999999999999999999 ml")) {
            assertFalse(extractor.extract(message).isValid());
        }
        assertEquals(11000, extractor.extract("11 litros").quantidadeMl());
    }

    private record Water(Integer quantidadeMl) {}
}
