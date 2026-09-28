package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class NovoPacienteRequest {

    @NotBlank
    public String nome;

    @NotBlank
    @Email
    public String email;

    @NotBlank
    @Size(min = 8)
    public String senha;

    @Size(max = 25)
    public String telefone;

    @Positive
    public Double pesoAtualKg;
}