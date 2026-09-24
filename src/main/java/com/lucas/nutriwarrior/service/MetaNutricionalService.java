package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.dto.MetaNutricionalRequest;
import com.lucas.nutriwarrior.model.dto.MetaNutricionalResponse;
import com.lucas.nutriwarrior.model.entity.Cliente;
import com.lucas.nutriwarrior.model.entity.MetaNutricional;
import com.lucas.nutriwarrior.repository.ClienteRepository;
import com.lucas.nutriwarrior.repository.MetaNutricionalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MetaNutricionalService {
    private final MetaNutricionalRepository repository;
    private final ClienteRepository clienteRepository;
    private final ClienteAccessService accessService;

    public MetaNutricionalService(MetaNutricionalRepository repository,
            ClienteRepository clienteRepository,
            ClienteAccessService accessService) {
        this.repository = repository;
        this.clienteRepository = clienteRepository;
        this.accessService = accessService;
    }

    public MetaNutricionalResponse buscar(Long clienteId) {
        accessService.exigirAcesso(clienteId);
        return MetaNutricionalResponse.fromEntity(buscarMeta(clienteId));
    }

    public MetaNutricionalResponse salvar(Long clienteId,
            MetaNutricionalRequest request) {
        accessService.exigirAcesso(clienteId);
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Cliente nao encontrado com id=" + clienteId));
        MetaNutricional meta = repository.findByCliente_Id(clienteId)
            .orElseGet(MetaNutricional::new);
        meta.cliente = cliente;
        meta.calorias = request.calorias;
        meta.proteinasGramas = request.proteinasGramas;
        meta.carboidratosGramas = request.carboidratosGramas;
        meta.gordurasGramas = request.gordurasGramas;
        meta.aguaMl = request.aguaMl;
        return MetaNutricionalResponse.fromEntity(repository.save(meta));
    }

    private MetaNutricional buscarMeta(Long clienteId) {
        clienteRepository.findById(clienteId).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Cliente nao encontrado com id=" + clienteId));
        return repository.findByCliente_Id(clienteId).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Metas nao cadastradas para o cliente"));
    }
}