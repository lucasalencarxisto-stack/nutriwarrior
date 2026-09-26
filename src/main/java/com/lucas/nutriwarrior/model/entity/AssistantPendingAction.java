package com.lucas.nutriwarrior.model.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "assistant_pending_action")
public class AssistantPendingAction {
    @Id
    @Column(length = 36)
    public String id;

    @Column(name = "user_id", nullable = false)
    public Long userId;

    @Column(name = "cliente_id", nullable = false)
    public Long clienteId;

    @Column(nullable = false, length = 40)
    public String intent;

    @Column(name = "payload_json", nullable = false, columnDefinition = "text")
    public String payloadJson;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    public Instant expiresAt;

    @Column(name = "consumed_at")
    public Instant consumedAt;

    @Version
    public Long version;
}
