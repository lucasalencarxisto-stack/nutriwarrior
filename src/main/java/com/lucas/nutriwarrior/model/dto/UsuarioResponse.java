package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.entity.Usuario;

public class UsuarioResponse {
    public Long id;
    public String nome;
    public String email;
    public String role;
    public Long clienteId;

    public static UsuarioResponse fromEntity(Usuario usuario, Long clienteId) {
        UsuarioResponse response = new UsuarioResponse();
        response.id = usuario.id;
        response.nome = usuario.nome;
        response.email = usuario.email;
        response.role = usuario.role.name();
        response.clienteId = clienteId;
        return response;
    }
}