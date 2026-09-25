package com.lucas.nutriwarrior.assistant;

import jakarta.validation.constraints.NotBlank;

public record AssistantChatExecuteRequest(
    @NotBlank(message = "confirmationId e obrigatorio") String confirmationId
) {}
