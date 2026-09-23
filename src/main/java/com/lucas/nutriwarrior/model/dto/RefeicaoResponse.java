package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.entity.Refeicao;
import com.lucas.nutriwarrior.model.entity.TipoRefeicao;

import java.time.LocalTime;

public class RefeicaoResponse {

    public Long id;
    public Long diaRegistroId;
    public TipoRefeicao tipo;
    public LocalTime horario;

    public RefeicaoResponse(
            Long id,
            Long diaRegistroId,
            TipoRefeicao tipo,
            LocalTime horario) {

        this.id = id;
        this.diaRegistroId = diaRegistroId;
        this.tipo = tipo;
        this.horario = horario;
    }

    public static RefeicaoResponse fromEntity(Refeicao refeicao) {
        return new RefeicaoResponse(
            refeicao.id,
            refeicao.diaRegistro.id,
            refeicao.tipo,
            refeicao.horario
        );
    }
}