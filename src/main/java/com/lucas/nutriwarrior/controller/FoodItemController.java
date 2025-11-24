package com.lucas.nutriwarrior.controller;

import com.lucas.nutriwarrior.model.FoodItem;
import com.lucas.nutriwarrior.repository.FoodItemRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
public class FoodItemController {

    private final FoodItemRepository repository;

    public FoodItemController(FoodItemRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<FoodItem> listAll() {
        return repository.findAll();
    }

    @PostMapping
    public FoodItem create(@RequestBody FoodItem foodItem) {
        return repository.save(foodItem);
    }
}
