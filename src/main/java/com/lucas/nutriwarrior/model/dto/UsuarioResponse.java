package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.entity.Usuario;

import com.lucas.nutriwarrior.model.entity.Cliente;

import java.time.LocalDate;

public class UsuarioResponse {
    public Long id;
    public String nome;
    public String email;
    public String telefone;
    public String role;
    public Long clienteId;
    public Double alturaCm;
    public LocalDate dataNascimento;

    public static UsuarioResponse fromEntity(Usuario usuario, Long clienteId) {
        UsuarioResponse response = new UsuarioResponse();
        response.id = usuario.id;
        response.nome = usuario.nome;
        response.email = usuario.email;
        response.telefone = usuario.telefone;
        response.role = usuario.role.name();
        response.clienteId = clienteId;
        return response;
    }

    public static UsuarioResponse fromPaciente(
        Usuario usuario,
        Cliente cliente) {

    UsuarioResponse response =
        fromEntity(
            usuario,
            cliente.id
        );

    response.alturaCm =
        cliente.alturaCm;

    response.dataNascimento =
        cliente.dataNascimento;

    return response;
 }
}