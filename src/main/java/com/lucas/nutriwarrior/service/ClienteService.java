package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.dto.ClienteResponse;
import com.lucas.nutriwarrior.model.dto.NovoClienteRequest;
import com.lucas.nutriwarrior.model.entity.Cliente;
import com.lucas.nutriwarrior.repository.ClienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
        return ClienteResponse.fromEntity(buscarEntity(id));
    }

    public ClienteResponse atualizar(Long id, NovoClienteRequest request) {
        Cliente cliente = buscarEntity(id);

        cliente.nome = request.nome;
        cliente.pesoAtualKg = request.pesoAtualKg;

        Cliente atualizado = clienteRepository.save(cliente);

        return ClienteResponse.fromEntity(atualizado);
    }

    public void deletar(Long id) {
        Cliente cliente = buscarEntity(id);
        clienteRepository.delete(cliente);
    }

    private Cliente buscarEntity(Long id) {
        return clienteRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Cliente nao encontrado com id=" + id
            ));
    }
}
