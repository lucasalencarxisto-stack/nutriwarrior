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
    private final ClienteAccessService accessService;

    public ClienteService(ClienteRepository clienteRepository,
            ClienteAccessService accessService) {
        this.clienteRepository = clienteRepository;
        this.accessService = accessService;
    }

    public ClienteResponse criar(NovoClienteRequest request) {
        var nutricionista = accessService.exigirRole(
            com.lucas.nutriwarrior.model.entity.Role.NUTRICIONISTA);
        Cliente cliente = new Cliente();
        cliente.nome = request.nome;
        cliente.pesoAtualKg = request.pesoAtualKg;
        cliente.nutricionista = nutricionista;

        Cliente salvo = clienteRepository.save(cliente);
        return ClienteResponse.fromEntity(salvo);
    }

    public List<ClienteResponse> listarTodos() {
        var usuario = accessService.usuarioAtual();
        var clientes = usuario.role == com.lucas.nutriwarrior.model.entity.Role.NUTRICIONISTA
            ? clienteRepository.findAllByNutricionista_IdOrderByIdAsc(usuario.id)
            : clienteRepository.findByUsuario_Id(usuario.id).stream().toList();
        return clientes
            .stream()
            .map(ClienteResponse::fromEntity)
            .toList();
    }

    public ClienteResponse buscarPorId(Long id) {
        accessService.exigirAcesso(id);
        return ClienteResponse.fromEntity(buscarEntity(id));
    }

    public ClienteResponse atualizar(Long id, NovoClienteRequest request) {
        accessService.exigirAcesso(id);
        Cliente cliente = buscarEntity(id);

        cliente.nome = request.nome;
        cliente.pesoAtualKg = request.pesoAtualKg;

        Cliente atualizado = clienteRepository.save(cliente);

        return ClienteResponse.fromEntity(atualizado);
    }

    public void deletar(Long id) {
        accessService.exigirAcesso(id);
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
