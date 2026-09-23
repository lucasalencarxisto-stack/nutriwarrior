package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.DiaRegistroRequest;
import com.lucas.nutriwarrior.model.dto.DiaRegistroResponse;
import com.lucas.nutriwarrior.service.DiaRegistroService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/clientes/{clienteId}/dias")
public class DiaRegistroController {

    private final DiaRegistroService service;

    public DiaRegistroController(DiaRegistroService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<DiaRegistroResponse> criar(
            @PathVariable Long clienteId,
            @Valid @RequestBody DiaRegistroRequest request) {

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.criar(clienteId, request));
    }

    @GetMapping
    public List<DiaRegistroResponse> listar(
            @PathVariable Long clienteId) {

        return service.listar(clienteId);
    }

    @GetMapping("/{data}")
    public DiaRegistroResponse buscarPorData(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data) {

        return service.buscarPorData(clienteId, data);
    }

    @DeleteMapping("/{data}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data) {

        service.deletar(clienteId, data);

        return ResponseEntity.noContent().build();
    }
}