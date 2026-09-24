CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_usuario_email UNIQUE (email)
);

ALTER TABLE cliente ADD COLUMN usuario_id BIGINT;
ALTER TABLE cliente ADD COLUMN nutricionista_id BIGINT;

ALTER TABLE cliente ADD CONSTRAINT fk_cliente_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id);
ALTER TABLE cliente ADD CONSTRAINT fk_cliente_nutricionista
    FOREIGN KEY (nutricionista_id) REFERENCES usuario (id);

CREATE UNIQUE INDEX uk_cliente_usuario ON cliente (usuario_id);
CREATE INDEX ix_cliente_nutricionista ON cliente (nutricionista_id);