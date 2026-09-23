package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.ClienteResponse;
import com.lucas.nutriwarrior.model.dto.NovoClienteRequest;
import com.lucas.nutriwarrior.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> criar(
            @Valid @RequestBody NovoClienteRequest request) {

        ClienteResponse cliente = clienteService.criar(request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(cliente);
    }

    @GetMapping
    public List<ClienteResponse> listar() {
        return clienteService.listarTodos();
    }

    @GetMapping("/{id}")
    public ClienteResponse buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public ClienteResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody NovoClienteRequest request) {

        return clienteService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        clienteService.deletar(id);

        return ResponseEntity.noContent().build();
    }
}
