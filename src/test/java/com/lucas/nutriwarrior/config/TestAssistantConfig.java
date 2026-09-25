package com.lucas.nutriwarrior.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucas.nutriwarrior.assistant.LlmClient;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestAssistantConfig {

    @Bean
    @Primary
    public LlmClient fakeLlmClient() {
        return new TestLlmClient();
    }

    private static final class TestLlmClient implements LlmClient {
        private final ObjectMapper objectMapper = new ObjectMapper();

        @Override
        public String chat(String systemPrompt, String userMessage) {
            String text = userMessage == null ? "" : userMessage.toLowerCase();
            if (text.contains("500 ml") || text.contains("meio litro") || text.contains("litro")) {
                return "{\"intent\":\"REGISTRAR_AGUA\"}";
            }
            if (text.contains("74,3") || text.contains("peso") || text.contains("81 kg")) {
                return "{\"intent\":\"REGISTRAR_PESO\"}";
            }
            if (text.contains("arroz") && text.contains("frango")) {
                if (text.equals("comi arroz e frango")) {
                    return "{\"intent\":\"REGISTRAR_REFEICAO\"}";
                }
                if (text.contains("quantidade") || text.contains("comi arroz e frango")) {
                    return "{\"intent\":\"CLARIFY\"}";
                }
                return "{\"intent\":\"REGISTRAR_REFEICAO\"}";
            }
            if (text.contains("resumo") || text.contains("meta") || text.contains("refeicao")) {
                return "{\"intent\":\"CONSULTAR_RESUMO\"}";
            }
            if (text.contains("python") || text.contains("flask") || text.contains("system prompt") || text.contains("deveres")) {
                return "{\"intent\":\"OUT_OF_SCOPE\"}";
            }
            if (text.contains("agua") || text.contains("água")) {
                return "{\"intent\":\"REGISTRAR_AGUA\"}";
            }
            return "{\"intent\":\"GENERAL_NUTRITION\"}";
        }

        @Override
        public <T> T chatStructured(String systemPrompt, String userMessage, Class<T> responseType, String jsonSchemaName) {
            String content = chat(systemPrompt, userMessage);
            try {
                return objectMapper.readValue(content, responseType);
            } catch (Exception e) {
                throw new IllegalStateException("JSON invalido em LLM fake", e);
            }
        }
    }
}
