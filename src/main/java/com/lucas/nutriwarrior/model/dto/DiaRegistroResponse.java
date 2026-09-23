package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.entity.DiaRegistro;

import java.time.LocalDate;

public class DiaRegistroResponse {

    public Long id;
    public Long clienteId;
    public LocalDate data;

    public DiaRegistroResponse(Long id, Long clienteId, LocalDate data) {
        this.id = id;
        this.clienteId = clienteId;
        this.data = data;
    }

    public static DiaRegistroResponse fromEntity(DiaRegistro dia) {
        return new DiaRegistroResponse(
            dia.id,
            dia.cliente.id,
            dia.data
        );
    }
}