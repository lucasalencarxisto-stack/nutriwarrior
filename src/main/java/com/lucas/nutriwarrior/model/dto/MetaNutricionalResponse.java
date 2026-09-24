package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.entity.MetaNutricional;
import java.math.BigDecimal;

public class MetaNutricionalResponse {
    public Long clienteId;
    public BigDecimal calorias;
    public BigDecimal proteinasGramas;
    public BigDecimal carboidratosGramas;
    public BigDecimal gordurasGramas;
    public Integer aguaMl;

    public static MetaNutricionalResponse fromEntity(MetaNutricional meta) {
        MetaNutricionalResponse response = new MetaNutricionalResponse();
        response.clienteId = meta.cliente.id;
        response.calorias = meta.calorias;
        response.proteinasGramas = meta.proteinasGramas;
        response.carboidratosGramas = meta.carboidratosGramas;
        response.gordurasGramas = meta.gordurasGramas;
        response.aguaMl = meta.aguaMl;
        return response;
    }
}