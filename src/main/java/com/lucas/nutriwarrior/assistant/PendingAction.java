package com.lucas.nutriwarrior.assistant;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record PendingAction(
    String id,
    Long userId,
    Long clienteId,
    AssistantIntent intent,
    Map<String, Object> payload,
    Instant createdAt,
    Instant expiresAt,
    boolean consumed
) {
    public PendingAction {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (expiresAt == null) {
            expiresAt = createdAt.plusSeconds(600);
        }
    }

    public boolean expired() {
        return Instant.now().isAfter(expiresAt);
    }

    public PendingAction consumedCopy() {
        return new PendingAction(id, userId, clienteId, intent, payload, createdAt,
            expiresAt, true);
    }
}
