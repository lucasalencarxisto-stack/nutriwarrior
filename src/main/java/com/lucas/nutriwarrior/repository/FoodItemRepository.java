package com.lucas.nutriwarrior.repository;

import com.lucas.nutriwarrior.model.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
}

