package com.lucas.nutriwarrior.assistant.command;

import com.lucas.nutriwarrior.model.entity.TipoRefeicao;

import java.math.BigDecimal;
import java.util.List;

public record MealCommand(TipoRefeicao tipoRefeicao, List<Item> itens) {
    public boolean isValid() {
        return tipoRefeicao != null && itens != null && !itens.isEmpty();
    }

    public record Item(String alimento, BigDecimal quantidadeGramas) {
        public boolean isValid() {
            return alimento != null && !alimento.isBlank() && quantidadeGramas != null
                && quantidadeGramas.compareTo(BigDecimal.ZERO) > 0;
        }
    }
}
