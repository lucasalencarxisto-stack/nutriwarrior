ALTER TABLE cliente
    ADD COLUMN tags TEXT NOT NULL DEFAULT '';

CREATE TABLE appointment (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    nutricionista_id BIGINT NOT NULL REFERENCES usuario(id),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX ix_appointment_nutritionist_starts
    ON appointment(nutricionista_id, starts_at);

CREATE INDEX ix_appointment_client_starts
    ON appointment(cliente_id, starts_at);

CREATE TABLE patient_note (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES usuario(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX ix_patient_note_client_created
    ON patient_note(cliente_id, created_at);
