package com.lucas.nutriwarrior.assistant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class AssistantChatRequest {

    @NotBlank(message = "Mensagem e obrigatoria")
    public String message;

    @Positive(message = "clienteId deve ser positivo")
    public Long clienteId;
}