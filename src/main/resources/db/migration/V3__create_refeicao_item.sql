CREATE TABLE refeicao (
    id BIGSERIAL PRIMARY KEY,
    dia_registro_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- CAFÉ_DA_MANHA, ALMOCO, JANTAR, LANCHE
    horario TIME,
    CONSTRAINT fk_refeicao_dia_registro
        FOREIGN KEY (dia_registro_id)
        REFERENCES dia_registro (id)
        ON DELETE CASCADE
);

CREATE TABLE item_refeicao (
    id BIGSERIAL PRIMARY KEY,
    refeicao_id BIGINT NOT NULL,
    alimento VARCHAR(255) NOT NULL,
    quantidade_gramas NUMERIC(10,2),
    kcal NUMERIC(10,2),
    carb_gramas NUMERIC(10,2),
    prot_gramas NUMERIC(10,2),
    gord_gramas NUMERIC(10,2),
    CONSTRAINT fk_item_refeicao_refeicao
        FOREIGN KEY (refeicao_id)
        REFERENCES refeicao (id)
        ON DELETE CASCADE
);
