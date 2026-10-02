CREATE TABLE meal_plan_draft (
    id BIGSERIAL PRIMARY KEY,

    cliente_id BIGINT NOT NULL
        REFERENCES cliente(id) ON DELETE CASCADE,

    author_id BIGINT NOT NULL
        REFERENCES usuario(id),

    title VARCHAR(160) NOT NULL DEFAULT '',
    plan_date DATE,
    notes TEXT NOT NULL DEFAULT '',
    payload TEXT NOT NULL DEFAULT '{"meals":[]}',

    version BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT uk_meal_plan_draft_cliente UNIQUE (cliente_id)
);
