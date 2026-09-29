package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class AtualizarPacienteRequest {

    public String nome;

    @Email
    public String email;

    @Size(max = 25)
    public String telefone;

    @Size(min = 8)
    public String senha;

    @Positive
    public Double alturaCm;

    public LocalDate dataNascimento;
}