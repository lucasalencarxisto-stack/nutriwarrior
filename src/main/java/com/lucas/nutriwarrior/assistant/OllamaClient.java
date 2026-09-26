package com.lucas.nutriwarrior.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.web.client.RestClientException;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Locale;
import java.util.List;
import java.util.Map;

@Component
public class OllamaClient implements LlmClient {

    private final RestClient restClient;
    private final OllamaProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper()
        .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
        .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT);

    public OllamaClient(OllamaProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()));
        factory.setReadTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()));

        this.restClient = RestClient.builder()
            .baseUrl(properties.getBaseUrl())
            .requestFactory(factory)
            .build();
    }

    @Override
    public String chat(String systemPrompt, String userMessage) {
        OllamaChatRequest request = new OllamaChatRequest(
            properties.getModel(),
            false,
            false,
            List.of(
                new OllamaMessage("system", systemPrompt),
                new OllamaMessage("user", userMessage)
            ),
            new OllamaOptions(0.0, 512),
            properties.getKeepAlive(),
            null
        );

        return executeChat(request);
    }

    @Override
    public <T> T chatStructured(String systemPrompt, String userMessage, Class<T> responseType, String jsonSchemaName) {
        Map<String, Object> schema = buildSchema(jsonSchemaName);
        OllamaChatRequest request = new OllamaChatRequest(
            properties.getModel(),
            false,
            false,
            List.of(
                new OllamaMessage("system", systemPrompt),
                new OllamaMessage("user", userMessage)
            ),
            new OllamaOptions(0.0, 256),
            properties.getKeepAlive(),
            schema
        );

        String content = executeChat(request);

        try {
            return objectMapper.readValue(content, responseType);
        } catch (JsonProcessingException exception) {
            // Do not attach parser exceptions: they can contain model output.
            throw new InvalidLlmResponseException();
        }
    }

    private Map<String, Object> buildSchema(String name) {
        Map<String, Object> fields = switch (name) {
            case "AssistantIntent" -> Map.of("intent", Map.of("type", "string",
                "enum", java.util.Arrays.stream(AssistantIntent.values()).map(Enum::name).toList()));
            case "WaterExtraction" -> Map.of("quantidadeMl", Map.of("type", List.of("integer", "null")));
            case "WeightExtraction" -> Map.of("pesoKg", Map.of("type", List.of("number", "null")));
            case "MealExtraction" -> Map.of(
                "tipoRefeicao", Map.of("type", List.of("string", "null")),
                "itens", Map.of("type", "array", "items", Map.of(
                    "type", "object", "properties", Map.of(
                        "alimento", Map.of("type", List.of("string", "null")),
                        "quantidadeGramas", Map.of("type", List.of("number", "null"))),
                    "required", List.of("alimento", "quantidadeGramas"), "additionalProperties", false)));
            default -> throw new IllegalArgumentException("Schema do assistente desconhecido");
        };
        return Map.of("type", "object", "properties", fields,
            "required", List.copyOf(fields.keySet()), "additionalProperties", false);
    }

    private String executeChat(OllamaChatRequest request) {
        try {
            OllamaChatResponse response = restClient
                .post()
                .uri("/api/chat")
                .body(request)
                .retrieve()
                .body(OllamaChatResponse.class);

            if (response == null || response.message() == null || response.message().content() == null || response.message().content().isBlank()) {
                throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Resposta invalida do Ollama"
                );
            }
            String content = response.message().content();
            String normalized = content.toLowerCase(Locale.ROOT);
            if (normalized.contains("<think") || normalized.contains("</think")
                    || normalized.contains("<reasoning") || normalized.contains("</reasoning")) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Resposta invalida do Ollama");
            }
            return content;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "O assistente esta temporariamente indisponivel"
            );
        }
    }

    private record OllamaChatRequest(
        String model,
        boolean stream,
        boolean think,
        List<OllamaMessage> messages,
        OllamaOptions options,
        String keep_alive,
        Object format
    ) {
        @Override public String toString() { return "OllamaChatRequest[redacted]"; }
    }

    private record OllamaMessage(
        String role,
        String content
    ) {}

    private record OllamaOptions(
        double temperature,
        int num_predict
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OllamaChatResponse(
        OllamaResponseMessage message
    ) {
        @Override public String toString() { return "OllamaChatResponse[redacted]"; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OllamaResponseMessage(
        String role,
        String content
    ) {}
}