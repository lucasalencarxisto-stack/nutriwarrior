package com.lucas.nutriwarrior.assistant;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucas.nutriwarrior.assistant.command.MealCommand;
import com.lucas.nutriwarrior.assistant.command.WaterCommand;
import com.lucas.nutriwarrior.assistant.command.WeightCommand;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@Component
public class PendingActionPayloadCodec {
    private final ObjectMapper mapper;

    public PendingActionPayloadCodec(ObjectMapper mapper) {
        this.mapper = mapper.copy().deactivateDefaultTyping()
            .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
                DeserializationFeature.FAIL_ON_TRAILING_TOKENS,
                DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES,
                DeserializationFeature.FAIL_ON_NUMBERS_FOR_ENUMS)
            .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT);
        this.mapper.setConfig(this.mapper.getDeserializationConfig()
            .without(MapperFeature.ALLOW_COERCION_OF_SCALARS));
        this.mapper.addMixIn(MealCommand.Item.class, ValidationMixin.class);
    }

    public String encode(AssistantIntent intent, Map<String, Object> payload) {
        try {
            String json = mapper.writeValueAsString(payload);
            decode(intent, json);
            return json;
        } catch (JsonProcessingException exception) {
            throw invalidPayload();
        }
    }

    public Map<String, Object> decode(AssistantIntent intent, String json) {
        if (intent == null || json == null) throw invalidPayload();
        try {
            return switch (intent) {
                case REGISTRAR_AGUA -> {
                    WaterCommand command = mapper.readValue(json, WaterCommand.class);
                    if (command == null || !command.isValid()) throw invalidPayload();
                    yield Map.of("quantidadeMl", command.quantidadeMl());
                }
                case REGISTRAR_PESO -> {
                    WeightCommand command = mapper.readValue(json, WeightCommand.class);
                    if (command == null || !command.isValid()) throw invalidPayload();
                    yield Map.of("pesoKg", command.pesoKg());
                }
                case REGISTRAR_REFEICAO -> {
                    MealCommand command = mapper.readValue(json, MealCommand.class);
                    if (command == null || !command.isValid()) throw invalidPayload();
                    yield Map.of("tipoRefeicao", command.tipoRefeicao(), "itens", command.itens());
                }
                default -> throw invalidPayload();
            };
        } catch (JsonProcessingException exception) {
            // Parser messages may contain payload data. Never expose or attach them.
            throw invalidPayload();
        }
    }

    private abstract static class ValidationMixin {
        @JsonIgnore public abstract boolean isValid();
    }

    private ResponseStatusException invalidPayload() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload da acao pendente invalido");
    }
}
