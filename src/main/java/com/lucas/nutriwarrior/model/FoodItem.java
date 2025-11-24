package com.lucas.nutriwarrior.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // valores por 100g
    private Double calories;
    private Double protein;
    private Double carbs;
    private Double fat;

    public FoodItem() {
    }

    public FoodItem(String name, Double calories, Double protein, Double carbs, Double fat) {
        this.name = name;
        this.calories = calories;
        this.protein = protein;
        this.carbs = carbs;
        this.fat = fat;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Double getCalories() {
        return calories;
    }

    public Double getProtein() {
        return protein;
    }

    public Double getCarbs() {
        return carbs;
    }

    public Double getFat() {
        return fat;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCalories(Double calories) {
        this.calories = calories;
    }

    public void setProtein(Double protein) {
        this.protein = protein;
    }

    public void setCarbs(Double carbs) {
        this.carbs = carbs;
    }

    public void setFat(Double fat) {
        this.fat = fat;
    }
}
