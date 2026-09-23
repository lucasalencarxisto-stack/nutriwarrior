package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.dto.DiaRegistroRequest;
import com.lucas.nutriwarrior.model.dto.DiaRegistroResponse;
import com.lucas.nutriwarrior.model.entity.Cliente;
import com.lucas.nutriwarrior.model.entity.DiaRegistro;
import com.lucas.nutriwarrior.repository.ClienteRepository;
import com.lucas.nutriwarrior.repository.DiaRegistroRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class DiaRegistroService {

    private final DiaRegistroRepository diaRepository;
    private final ClienteRepository clienteRepository;

    public DiaRegistroService(
            DiaRegistroRepository diaRepository,
            ClienteRepository clienteRepository) {

        this.diaRepository = diaRepository;
        this.clienteRepository = clienteRepository;
    }

    public DiaRegistroResponse criar(
            Long clienteId,
            DiaRegistroRequest request) {

        Cliente cliente = buscarCliente(clienteId);

        if (diaRepository
                .findByCliente_IdAndData(clienteId, request.data)
                .isPresent()) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ja existe registro para esta data"
            );
        }

        DiaRegistro dia = new DiaRegistro();
        dia.cliente = cliente;
        dia.data = request.data;

        return DiaRegistroResponse.fromEntity(
            diaRepository.save(dia)
        );
    }

    public List<DiaRegistroResponse> listar(Long clienteId) {

        buscarCliente(clienteId);

        return diaRepository
            .findAllByCliente_IdOrderByDataAsc(clienteId)
            .stream()
            .map(DiaRegistroResponse::fromEntity)
            .toList();
    }

    public DiaRegistroResponse buscarPorData(
            Long clienteId,
            LocalDate data) {

        return DiaRegistroResponse.fromEntity(
            buscarDia(clienteId, data)
        );
    }

    public void deletar(Long clienteId, LocalDate data) {
        diaRepository.delete(
            buscarDia(clienteId, data)
        );
    }

    private Cliente buscarCliente(Long clienteId) {
        return clienteRepository.findById(clienteId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Cliente nao encontrado com id=" + clienteId
            ));
    }

    private DiaRegistro buscarDia(
            Long clienteId,
            LocalDate data) {

        buscarCliente(clienteId);

        return diaRepository
            .findByCliente_IdAndData(clienteId, data)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Registro diario nao encontrado"
            ));
    }
}