package com.lucas.nutriwarrior.assistant;

public record AssistantChatExecuteResponse(
    String message,
    AssistantIntent intent,
    boolean success
) {}
