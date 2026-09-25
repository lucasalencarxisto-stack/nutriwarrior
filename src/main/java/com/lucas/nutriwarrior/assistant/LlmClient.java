package com.lucas.nutriwarrior.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

public interface LlmClient {

    String chat(String systemPrompt, String userMessage);

    default <T> T chatStructured(String systemPrompt, String userMessage, Class<T> responseType, String jsonSchemaName) {
        String response = chat(systemPrompt, userMessage);
        try {
            return new ObjectMapper().readValue(response, responseType);
        } catch (IOException exception) {
            throw new IllegalStateException("Resposta JSON invalida do modelo", exception);
        }
    }
}