package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class AtualizarPacienteRequest {

    public String nome;

    @Email
    public String email;

    @Size(max = 25)
    public String telefone;

    @Size(min = 8)
    public String senha;
}