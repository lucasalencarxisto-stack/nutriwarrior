package com.lucas.nutriwarrior.model.dto;

public class AuthResponse {
    public String accessToken;
    public String tokenType = "Bearer";
    public long expiresIn;
    public UsuarioResponse usuario;
}