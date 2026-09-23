package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.dto.FoodItemRequest;
import com.lucas.nutriwarrior.model.dto.FoodItemResponse;
import com.lucas.nutriwarrior.service.FoodItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
public class FoodItemController {

    private final FoodItemService service;

    public FoodItemController(FoodItemService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<FoodItemResponse> criar(
            @Valid @RequestBody FoodItemRequest request) {

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(service.criar(request));
    }

    @GetMapping
    public List<FoodItemResponse> listar() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public FoodItemResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public FoodItemResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody FoodItemRequest request) {

        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);

        return ResponseEntity.noContent().build();
    }
}