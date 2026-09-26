package com.lucas.nutriwarrior.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;

public interface LlmClient {

    String chat(String systemPrompt, String userMessage);

    default <T> T chatStructured(String systemPrompt, String userMessage, Class<T> responseType, String jsonSchemaName) {
        String response = chat(systemPrompt, userMessage);
        try {
            return new ObjectMapper()
                .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
                .readValue(response, responseType);
        } catch (JsonProcessingException exception) {
            throw new InvalidLlmResponseException();
        }
    }
}