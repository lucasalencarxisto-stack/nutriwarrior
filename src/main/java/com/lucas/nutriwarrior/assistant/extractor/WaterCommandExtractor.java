package com.lucas.nutriwarrior.assistant.extractor;

import com.lucas.nutriwarrior.assistant.LlmClient;
import com.lucas.nutriwarrior.assistant.InvalidLlmResponseException;
import com.lucas.nutriwarrior.assistant.PromptLoader;
import com.lucas.nutriwarrior.assistant.command.WaterCommand;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WaterCommandExtractor {

    private final LlmClient llmClient;
    private final PromptLoader promptLoader;

    public WaterCommandExtractor(LlmClient llmClient, PromptLoader promptLoader) {
        this.llmClient = llmClient;
        this.promptLoader = promptLoader;
    }

    public WaterCommand extract(String message) {
        if (message == null || message.isBlank()) {
            return new WaterCommand(0);
        }

        try {
            WaterJson payload = llmClient.chatStructured(
                promptLoader.load("extract-water.txt"),
                message,
                WaterJson.class,
                "WaterExtraction"
            );
            if (payload != null && payload.quantidadeMl() != null) {
                return new WaterCommand(payload.quantidadeMl());
            }
        } catch (InvalidLlmResponseException ignored) {
            // Fallback to deterministic parsing below.
        }

        return new WaterCommand(parseMililitros(message));
    }

    private int parseMililitros(String message) {
        String normalized = message.toLowerCase(Locale.ROOT).replace(',', '.');
        if (normalized.contains("meio litro")) {
            return 500;
        }

        Pattern pattern = Pattern.compile("(-?\\d+(?:\\.\\d+)?)\\s*(ml|l|litro|litros)");
        Matcher matcher = pattern.matcher(normalized);
        if (matcher.find()) {
            String value = matcher.group(1);
            String unit = matcher.group(2);
            double number = Double.parseDouble(value);
            double milliliters = unit.equals("ml") ? number : number * 1000d;
            if (!Double.isFinite(milliliters) || milliliters <= 0 || milliliters > Integer.MAX_VALUE) {
                return 0;
            }
            return (int) Math.round(milliliters);
        }

        return 0;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record WaterJson(Integer quantidadeMl) {}
}
