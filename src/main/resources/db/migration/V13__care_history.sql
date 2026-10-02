CREATE TABLE care_entry (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES usuario(id),
    author_name VARCHAR(255) NOT NULL,
    request_id VARCHAR(36) NOT NULL,
    kind VARCHAR(20) NOT NULL,
    entry_date DATE NOT NULL,
    return_date DATE,
    title VARCHAR(160) NOT NULL,
    notes TEXT NOT NULL,
    anamnesis TEXT NOT NULL,
    payload TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_care_request UNIQUE(cliente_id, request_id)
);
CREATE INDEX ix_care_client ON care_entry(cliente_id, id);
