package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.dto.ClienteResponse;
import com.lucas.nutriwarrior.model.dto.NovoClienteRequest;
import com.lucas.nutriwarrior.model.entity.Cliente;
import com.lucas.nutriwarrior.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public ClienteResponse criar(NovoClienteRequest request) {
        Cliente cliente = new Cliente();
        cliente.nome = request.nome;
        cliente.pesoAtualKg = request.pesoAtualKg;

        Cliente salvo = clienteRepository.save(cliente);
        return ClienteResponse.fromEntity(salvo);
    }

    public List<ClienteResponse> listarTodos() {
        return clienteRepository.findAll()
            .stream()
            .map(ClienteResponse::fromEntity)
            .toList();
    }

    public ClienteResponse buscarPorId(Long id) {
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Cliente não encontrado com id=" + id
            ));

        return ClienteResponse.fromEntity(cliente);
    }
}
