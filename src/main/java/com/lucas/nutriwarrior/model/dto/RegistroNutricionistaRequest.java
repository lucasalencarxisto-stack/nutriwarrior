package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegistroNutricionistaRequest {
    @NotBlank(message = "Nome e obrigatorio")
    public String nome;

    @NotBlank(message = "Email e obrigatorio")
    @Email(message = "Email invalido")
    public String email;

    @NotBlank(message = "Senha e obrigatoria")
    @Size(min = 8, message = "Senha deve ter ao menos 8 caracteres")
    public String senha;
}