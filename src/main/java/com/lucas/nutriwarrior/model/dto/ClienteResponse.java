package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.entity.Cliente;

public class ClienteResponse {
    public Long id;
    public String nome;
    public Double pesoAtualKg;

    public ClienteResponse(Long id, String nome, Double pesoAtualKg) {
        this.id = id;
        this.nome = nome;
        this.pesoAtualKg = pesoAtualKg;
    }

    public static ClienteResponse fromEntity(Cliente cliente) {
        return new ClienteResponse(
            cliente.id,
            cliente.nome,
            cliente.pesoAtualKg
        );
    }
}
