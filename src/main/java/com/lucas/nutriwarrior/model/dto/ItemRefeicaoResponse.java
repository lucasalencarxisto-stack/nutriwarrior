package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.entity.ItemRefeicao;

import java.math.BigDecimal;

public class ItemRefeicaoResponse {

    public Long id;
    public Long foodItemId;
    public String alimento;
    public BigDecimal quantidadeGramas;
    public BigDecimal kcal;
    public BigDecimal carboidratosGramas;
    public BigDecimal proteinasGramas;
    public BigDecimal gordurasGramas;

    public static ItemRefeicaoResponse fromEntity(ItemRefeicao item) {

        ItemRefeicaoResponse response = new ItemRefeicaoResponse();

        response.id = item.id;
        response.foodItemId = item.foodItem.getId();
        response.alimento = item.alimento;
        response.quantidadeGramas = item.quantidadeGramas;
        response.kcal = item.kcal;
        response.carboidratosGramas = item.carboidratosGramas;
        response.proteinasGramas = item.proteinasGramas;
        response.gordurasGramas = item.gordurasGramas;

        return response;
    }
}