CREATE TABLE plan_template (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    title VARCHAR(160) NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    payload TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX ix_plan_template_author_updated
    ON plan_template(author_id, updated_at DESC);
