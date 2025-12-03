package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.ClienteResponse;
import com.lucas.nutriwarrior.model.dto.NovoClienteRequest;
import com.lucas.nutriwarrior.service.ClienteService;
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
    public ClienteResponse criar(@RequestBody NovoClienteRequest request) {
        return clienteService.criar(request);
    }

    @GetMapping
    public List<ClienteResponse> listar() {
        return clienteService.listarTodos();
    }

    @GetMapping("/{id}")
    public ClienteResponse buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id);
    }
}
