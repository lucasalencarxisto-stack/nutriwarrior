package com.lucas.nutriwarrior.assistant;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class PromptLoader {

    public String load(String name) {
        try {
            ClassPathResource resource = new ClassPathResource("prompts/" + name);
            try (var input = resource.getInputStream()) {
                return new String(input.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Prompt nao encontrado: " + name, exception);
        }
    }
}
