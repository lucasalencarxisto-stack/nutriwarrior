package com.lucas.nutriwarrior.assistant.extractor;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.lucas.nutriwarrior.assistant.LlmClient;
import com.lucas.nutriwarrior.assistant.InvalidLlmResponseException;
import com.lucas.nutriwarrior.assistant.PromptLoader;
import com.lucas.nutriwarrior.assistant.command.MealCommand;
import com.lucas.nutriwarrior.model.entity.TipoRefeicao;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class MealCommandExtractor {

    private final LlmClient llmClient;
    private final PromptLoader promptLoader;

    public MealCommandExtractor(LlmClient llmClient, PromptLoader promptLoader) {
        this.llmClient = llmClient;
        this.promptLoader = promptLoader;
    }

    public MealCommand extract(String message) {
        if (message == null || message.isBlank()) {
            return new MealCommand(null, List.of());
        }

        try {
            MealJson payload = llmClient.chatStructured(
                promptLoader.load("extract-meal.txt"),
                message,
                MealJson.class,
                "MealExtraction"
            );
            if (payload != null && payload.tipoRefeicao() != null && payload.itens() != null && !payload.itens().isEmpty()) {
                List<MealCommand.Item> items = payload.itens().stream()
                    .map(item -> item == null ? new MealCommand.Item(null, null)
                        : new MealCommand.Item(item.alimento(), item.quantidadeGramas()))
                    .toList();
                return new MealCommand(payload.tipoRefeicao(), items);
            }
        } catch (InvalidLlmResponseException ignored) {
            // Fallback below.
        }

        return fallback(message);
    }

    private MealCommand fallback(String message) {
        String normalized = message.toLowerCase(Locale.ROOT);
        TipoRefeicao tipo = detectTipo(normalized);
        List<MealCommand.Item> items = new ArrayList<>();
        Matcher matcher = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(g|gramas|grama)")
            .matcher(message);
        java.util.List<String> foods = List.of("arroz", "frango", "banana", "ovo", "peixe", "feijao", "macarrao");
        for (String food : foods) {
            if (normalized.contains(food)) {
                BigDecimal quantity = null;
                if (matcher.find()) {
                    quantity = new BigDecimal(matcher.group(1).replace(',', '.'));
                }
                if (quantity != null && quantity.compareTo(BigDecimal.ZERO) > 0) {
                    items.add(new MealCommand.Item(food, quantity));
                }
            }
        }
        return new MealCommand(tipo, items);
    }

    private TipoRefeicao detectTipo(String normalized) {
        if (normalized.contains("almoço") || normalized.contains("almoco")) return TipoRefeicao.ALMOCO;
        if (normalized.contains("jantar")) return TipoRefeicao.JANTAR;
        if (normalized.contains("lanche")) return TipoRefeicao.LANCHE;
        if (normalized.contains("cafe") || normalized.contains("café")) return TipoRefeicao.CAFE_DA_MANHA;
        if (normalized.contains("ceia")) return TipoRefeicao.CEIA;
        return null;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record MealJson(TipoRefeicao tipoRefeicao, List<ItemJson> itens) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ItemJson(String alimento, BigDecimal quantidadeGramas) {}
}
