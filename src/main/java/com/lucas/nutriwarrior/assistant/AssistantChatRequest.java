package com.lucas.nutriwarrior.assistant;

import jakarta.validation.constraints.NotBlank;

public class AssistantChatRequest {

    @NotBlank(message = "Mensagem e obrigatoria")
    public String message;

    public Long clienteId;
}