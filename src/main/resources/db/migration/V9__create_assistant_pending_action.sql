CREATE TABLE assistant_pending_action (
    id VARCHAR(36) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    cliente_id BIGINT NOT NULL,
    intent VARCHAR(40) NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_assistant_pending_user FOREIGN KEY (user_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_assistant_pending_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id) ON DELETE CASCADE,
    CONSTRAINT ck_assistant_pending_expiry CHECK (expires_at > created_at)
);

CREATE INDEX ix_assistant_pending_expires_at ON assistant_pending_action (expires_at);
