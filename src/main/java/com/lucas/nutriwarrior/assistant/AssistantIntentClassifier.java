package com.lucas.nutriwarrior.assistant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class AssistantIntentClassifier {

    private final LlmClient llmClient;
    private final PromptLoader promptLoader;

    public AssistantIntentClassifier(LlmClient llmClient, PromptLoader promptLoader) {
        this.llmClient = llmClient;
        this.promptLoader = promptLoader;
    }

    public AssistantIntent classify(String message) {
        String normalized = message == null ? "" : message.trim();
        if (normalized.isBlank()) {
            return AssistantIntent.CLARIFY;
        }

        try {
            IntentPayload payload = llmClient.chatStructured(
                promptLoader.load("intent-classifier.txt"),
                normalized,
                IntentPayload.class,
                "AssistantIntent"
            );
            AssistantIntent intent = parseIntent(payload);
            if (intent != null) {
                return intent;
            }
        } catch (Exception ignored) {
            // Fall back to deterministic heuristics below.
        }

        return fallbackFromText(normalized);
    }

    private AssistantIntent parseIntent(IntentPayload payload) {
        if (payload == null || payload.intent() == null || payload.intent().isBlank()) {
            return null;
        }
        try {
            return AssistantIntent.valueOf(payload.intent().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private AssistantIntent fallbackFromText(String message) {
        String normalized = message.toLowerCase(Locale.ROOT);
        if (normalized.contains("ignore") && normalized.contains("system prompt")) {
            return AssistantIntent.OUT_OF_SCOPE;
        }
        if (normalized.contains("python") || normalized.contains("flask") || normalized.contains("codigo")
            || normalized.contains("api flask") || normalized.contains("escreva uma api")) {
            return AssistantIntent.OUT_OF_SCOPE;
        }
        if (normalized.contains("água") || normalized.contains("agua") || normalized.contains("ml")
            || normalized.contains("litro") || normalized.contains("litros") || normalized.contains("meio litro")) {
            return AssistantIntent.REGISTRAR_AGUA;
        }
        if (normalized.contains("peso") || normalized.contains("kg") || normalized.contains("quilograma")) {
            return AssistantIntent.REGISTRAR_PESO;
        }
        if (normalized.contains("resumo") || normalized.contains("consumo") || normalized.contains("hoje")
            || normalized.contains("quanto") || normalized.contains("calorias")
            || normalized.contains("proteina") || normalized.contains("carboidrato")) {
            return AssistantIntent.CONSULTAR_RESUMO;
        }
        if (normalized.contains("meta") || normalized.contains("objetivo") || normalized.contains("metas")) {
            return AssistantIntent.CONSULTAR_METAS;
        }
        if (normalized.contains("refeicao") || normalized.contains("refeições") || normalized.contains("refeições")
            || normalized.contains("almoço") || normalized.contains("jantar") || normalized.contains("lanche")
            || normalized.contains("ceia") || normalized.contains("cafe") || normalized.contains("comi")) {
            return AssistantIntent.REGISTRAR_REFEICAO;
        }
        if (normalized.contains("aliment") || normalized.contains("nutri") || normalized.contains("dieta")) {
            return AssistantIntent.GENERAL_NUTRITION;
        }
        return AssistantIntent.OUT_OF_SCOPE;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record IntentPayload(String intent) {}
}
