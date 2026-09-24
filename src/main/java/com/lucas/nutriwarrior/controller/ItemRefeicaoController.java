package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.ItemRefeicaoRequest;
import com.lucas.nutriwarrior.model.dto.ItemRefeicaoResponse;
import com.lucas.nutriwarrior.service.ItemRefeicaoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(
    "/clientes/{clienteId}/dias/{data}/refeicoes/{refeicaoId}/itens"
)
public class ItemRefeicaoController {

    private final ItemRefeicaoService service;

    public ItemRefeicaoController(
            ItemRefeicaoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ItemRefeicaoResponse> criar(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data,
            @PathVariable Long refeicaoId,
            @Valid @RequestBody ItemRefeicaoRequest request) {

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.criar(
                clienteId,
                data,
                refeicaoId,
                request
            ));
    }

    @GetMapping
    public List<ItemRefeicaoResponse> listar(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data,
            @PathVariable Long refeicaoId) {

        return service.listar(
            clienteId,
            data,
            refeicaoId
        );
    }

    @GetMapping("/{itemId}")
    public ItemRefeicaoResponse buscarPorId(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data,
            @PathVariable Long refeicaoId,
            @PathVariable Long itemId) {

        return service.buscarPorId(
            clienteId,
            data,
            refeicaoId,
            itemId
        );
    }

    @PutMapping("/{itemId}")
    public ItemRefeicaoResponse atualizar(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data,
            @PathVariable Long refeicaoId,
            @PathVariable Long itemId,
            @Valid @RequestBody ItemRefeicaoRequest request) {

        return service.atualizar(
            clienteId,
            data,
            refeicaoId,
            itemId,
            request
        );
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long clienteId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data,
            @PathVariable Long refeicaoId,
            @PathVariable Long itemId) {

        service.deletar(
            clienteId,
            data,
            refeicaoId,
            itemId
        );

        return ResponseEntity.noContent().build();
    }
}