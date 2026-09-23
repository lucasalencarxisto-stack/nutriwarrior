package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.entity.TipoRefeicao;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public class RefeicaoRequest {

    @NotNull(message = "Tipo da refeicao e obrigatorio")
    public TipoRefeicao tipo;

    public LocalTime horario;
}