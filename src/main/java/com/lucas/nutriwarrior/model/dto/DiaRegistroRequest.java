package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class DiaRegistroRequest {

    @NotNull(message = "Data e obrigatoria")
    public LocalDate data;
}