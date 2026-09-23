package com.lucas.nutriwarrior.service;

import com.lucas.nutriwarrior.model.FoodItem;
import com.lucas.nutriwarrior.model.dto.FoodItemRequest;
import com.lucas.nutriwarrior.model.dto.FoodItemResponse;
import com.lucas.nutriwarrior.repository.FoodItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FoodItemService {

    private final FoodItemRepository repository;

    public FoodItemService(FoodItemRepository repository) {
        this.repository = repository;
    }

    public FoodItemResponse criar(FoodItemRequest request) {
        FoodItem food = new FoodItem();

        aplicarDados(food, request);

        return FoodItemResponse.fromEntity(repository.save(food));
    }

    public List<FoodItemResponse> listarTodos() {
        return repository.findAll()
            .stream()
            .map(FoodItemResponse::fromEntity)
            .toList();
    }

    public FoodItemResponse buscarPorId(Long id) {
        return FoodItemResponse.fromEntity(buscarEntity(id));
    }

    public FoodItemResponse atualizar(Long id, FoodItemRequest request) {
        FoodItem food = buscarEntity(id);

        aplicarDados(food, request);

        return FoodItemResponse.fromEntity(repository.save(food));
    }

    public void deletar(Long id) {
        repository.delete(buscarEntity(id));
    }

    private FoodItem buscarEntity(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Alimento nao encontrado com id=" + id
            ));
    }

    private void aplicarDados(FoodItem food, FoodItemRequest request) {
        food.setName(request.name);
        food.setCalories(request.calories);
        food.setProtein(request.protein);
        food.setCarbs(request.carbs);
        food.setFat(request.fat);
    }
}