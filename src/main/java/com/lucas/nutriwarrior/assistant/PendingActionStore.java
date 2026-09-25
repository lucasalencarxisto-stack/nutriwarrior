package com.lucas.nutriwarrior.assistant;

public interface PendingActionStore {
    PendingAction create(PendingAction action);
    PendingAction require(String confirmationId);
    PendingAction consume(String confirmationId, Long userId);
}
