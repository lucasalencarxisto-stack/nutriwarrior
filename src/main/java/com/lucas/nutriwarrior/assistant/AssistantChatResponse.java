package com.lucas.nutriwarrior.assistant;

public record AssistantChatResponse(
    String message,
    AssistantIntent intent,
    boolean confirmationRequired,
    String confirmationId,
    String model
) {
    public AssistantChatResponse(String message, String model) {
        this(message, null, false, null, model);
    }
}