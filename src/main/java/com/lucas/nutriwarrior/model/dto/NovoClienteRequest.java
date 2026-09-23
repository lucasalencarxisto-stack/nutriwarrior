package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class NovoClienteRequest {

    @NotBlank(message = "Nome e obrigatorio")
    public String nome;

    @NotNull(message = "Peso atual e obrigatorio")
    @Positive(message = "Peso deve ser maior que zero")
    public Double pesoAtualKg;
}
