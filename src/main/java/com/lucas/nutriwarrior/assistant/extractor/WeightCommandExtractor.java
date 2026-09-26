package com.lucas.nutriwarrior.assistant.extractor;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.lucas.nutriwarrior.assistant.LlmClient;
import com.lucas.nutriwarrior.assistant.InvalidLlmResponseException;
import com.lucas.nutriwarrior.assistant.PromptLoader;
import com.lucas.nutriwarrior.assistant.command.WeightCommand;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WeightCommandExtractor {

    private final LlmClient llmClient;
    private final PromptLoader promptLoader;

    public WeightCommandExtractor(LlmClient llmClient, PromptLoader promptLoader) {
        this.llmClient = llmClient;
        this.promptLoader = promptLoader;
    }

    public WeightCommand extract(String message) {
        try {
            WeightJson payload = llmClient.chatStructured(
                promptLoader.load("extract-weight.txt"),
                message,
                WeightJson.class,
                "WeightExtraction"
            );
            if (payload != null && payload.pesoKg() != null) {
                return new WeightCommand(payload.pesoKg());
            }
        } catch (InvalidLlmResponseException ignored) {
            // Fallback below.
        }

        return new WeightCommand(parsePeso(message));
    }

    private BigDecimal parsePeso(String message) {
        String normalized = message.toLowerCase(Locale.ROOT).replace(',', '.');
        Pattern pattern = Pattern.compile("(-?\\d+(?:\\.\\d+)?)\\s*(kg|quilograma|quilogramas)");
        Matcher matcher = pattern.matcher(normalized);
        if (matcher.find()) {
            return new BigDecimal(matcher.group(1));
        }
        return BigDecimal.ZERO;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record WeightJson(BigDecimal pesoKg) {}
}
