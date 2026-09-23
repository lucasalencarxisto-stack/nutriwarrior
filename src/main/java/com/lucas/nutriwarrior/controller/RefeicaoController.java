package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.RefeicaoRequest;
import com.lucas.nutriwarrior.model.dto.RefeicaoResponse;
import com.lucas.nutriwarrior.service.RefeicaoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(
    "/clientes/{clienteId}/dias/{data}/refeicoes"
)
public class RefeicaoController {

    private final RefeicaoService service;

    public RefeicaoController(RefeicaoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<RefeicaoResponse> criar(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data,
            @Valid @RequestBody RefeicaoRequest request) {

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.criar(
                clienteId,
                data,
                request
            ));
    }

    @GetMapping
    public List<RefeicaoResponse> listar(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data) {

        return service.listar(clienteId, data);
    }

    @GetMapping("/{refeicaoId}")
    public RefeicaoResponse buscarPorId(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data,
            @PathVariable Long refeicaoId) {

        return service.buscarPorId(
            clienteId,
            data,
            refeicaoId
        );
    }

    @PutMapping("/{refeicaoId}")
    public RefeicaoResponse atualizar(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data,
            @PathVariable Long refeicaoId,
            @Valid @RequestBody RefeicaoRequest request) {

        return service.atualizar(
            clienteId,
            data,
            refeicaoId,
            request
        );
    }

    @DeleteMapping("/{refeicaoId}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data,
            @PathVariable Long refeicaoId) {

        service.deletar(
            clienteId,
            data,
            refeicaoId
        );

        return ResponseEntity.noContent().build();
    }
}