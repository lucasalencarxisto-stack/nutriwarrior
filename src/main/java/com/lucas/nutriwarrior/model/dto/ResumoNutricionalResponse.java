package com.lucas.nutriwarrior.model.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ResumoNutricionalResponse {
    public Long clienteId;
    public LocalDate data;
    public BigDecimal calorias;
    public BigDecimal proteinasGramas;
    public BigDecimal carboidratosGramas;
    public BigDecimal gordurasGramas;
    public int quantidadeRefeicoes;
    public int quantidadeItens;
    public BigDecimal pesoKg;
    public Integer aguaMl;
    public BigDecimal metaCalorias;
    public BigDecimal caloriasRestantes;
    public BigDecimal metaProteina;
    public BigDecimal proteinaRestante;
    public BigDecimal metaCarboidratos;
    public BigDecimal carboidratosRestantes;
    public BigDecimal metaGordura;
    public BigDecimal gorduraRestante;
    public Integer metaAguaMl;
    public Integer aguaRestanteMl;
}