ALTER TABLE dia_registro
ADD CONSTRAINT uq_dia_registro_cliente_data
UNIQUE (cliente_id, data);