package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    Optional<FoodItem> findByNameIgnoreCase(String name);
    List<FoodItem> findAllByNameContainingIgnoreCase(String name);
}

