package com.lucas.nutriwarrior.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Component
public class OllamaClient implements LlmClient {

    private final RestClient restClient;
    private final OllamaProperties properties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OllamaClient(OllamaProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(properties.getTimeoutSeconds() * 1000);
        factory.setReadTimeout(properties.getTimeoutSeconds() * 1000);

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
        } catch (Exception exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Resposta invalida do assistente",
                exception
            );
        }
    }

    private Map<String, Object> buildSchema(String jsonSchemaName) {
        return Map.of(
            "type", "json_schema",
            "json_schema", Map.of(
                "name", jsonSchemaName,
                "schema", Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "intent", Map.of("type", "string"),
                        "quantidadeMl", Map.of("type", "integer"),
                        "pesoKg", Map.of("type", "number"),
                        "tipoRefeicao", Map.of("type", "string"),
                        "itens", Map.of("type", "array")
                    ),
                    "required", List.of(),
                    "additionalProperties", false
                )
            )
        );
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
            return response.message().content();
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "O assistente esta temporariamente indisponivel",
                exception
            );
        }
    }

    private record OllamaChatRequest(
        String model,
        boolean stream,
        List<OllamaMessage> messages,
        OllamaOptions options,
        String keep_alive,
        Object format
    ) {}

    private record OllamaMessage(
        String role,
        String content
    ) {}

    private record OllamaOptions(
        double temperature,
        int num_predict
    ) {}

    private record OllamaChatResponse(
        OllamaResponseMessage message
    ) {}

    private record OllamaResponseMessage(
        String role,
        String content,
        String thinking
    ) {}
}