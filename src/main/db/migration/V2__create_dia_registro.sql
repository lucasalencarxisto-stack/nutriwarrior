CREATE TABLE cliente (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    data DATE NOT NULL,
    CONSTRAINT fk_dia_registro_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES cliente (id)
        ON DELETE CASCADE
);