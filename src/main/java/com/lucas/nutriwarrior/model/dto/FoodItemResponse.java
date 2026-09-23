package com.lucas.nutriwarrior.model.dto;

import com.lucas.nutriwarrior.model.FoodItem;

public class FoodItemResponse {

    public Long id;
    public String name;
    public Double calories;
    public Double protein;
    public Double carbs;
    public Double fat;

    public FoodItemResponse(
            Long id,
            String name,
            Double calories,
            Double protein,
            Double carbs,
            Double fat) {

        this.id = id;
        this.name = name;
        this.calories = calories;
        this.protein = protein;
        this.carbs = carbs;
        this.fat = fat;
    }

    public static FoodItemResponse fromEntity(FoodItem food) {
        return new FoodItemResponse(
            food.getId(),
            food.getName(),
            food.getCalories(),
            food.getProtein(),
            food.getCarbs(),
            food.getFat()
        );
    }
}