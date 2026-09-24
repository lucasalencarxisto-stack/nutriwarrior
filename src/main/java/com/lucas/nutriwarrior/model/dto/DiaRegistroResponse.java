package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.entity.DiaRegistro;

import java.time.LocalDate;
import java.math.BigDecimal;

public class DiaRegistroResponse {

    public Long id;
    public Long clienteId;
    public LocalDate data;
    public BigDecimal pesoKg;
    public Integer aguaMl;

    public DiaRegistroResponse(Long id, Long clienteId, LocalDate data,
            BigDecimal pesoKg, Integer aguaMl) {
        this.id = id;
        this.clienteId = clienteId;
        this.data = data;
        this.pesoKg = pesoKg;
        this.aguaMl = aguaMl;
    }

    public static DiaRegistroResponse fromEntity(DiaRegistro dia) {
        return new DiaRegistroResponse(
            dia.id,
            dia.cliente.id,
            dia.data,
            dia.pesoKg,
            dia.aguaMl
        );
    }
}