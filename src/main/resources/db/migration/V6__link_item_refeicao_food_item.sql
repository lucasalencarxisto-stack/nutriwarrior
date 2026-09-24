ALTER TABLE item_refeicao
ADD COLUMN food_item_id BIGINT NOT NULL;

ALTER TABLE item_refeicao
ADD CONSTRAINT fk_item_refeicao_food_item
FOREIGN KEY (food_item_id)
REFERENCES food_item (id);