ALTER TABLE dia_registro
    ADD COLUMN peso_kg NUMERIC(6,2);

ALTER TABLE dia_registro
    ADD COLUMN agua_ml INTEGER;

CREATE TABLE meta_nutricional (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT NOT NULL UNIQUE,
    calorias NUMERIC(10,2),
    proteinas_gramas NUMERIC(10,2),
    carboidratos_gramas NUMERIC(10,2),
    gorduras_gramas NUMERIC(10,2),
    agua_ml INTEGER,
    CONSTRAINT fk_meta_nutricional_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES cliente (id)
        ON DELETE CASCADE
);