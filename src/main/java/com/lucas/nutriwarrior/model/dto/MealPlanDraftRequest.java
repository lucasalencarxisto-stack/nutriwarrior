package com.lucas.nutriwarrior.model.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record MealPlanDraftRequest(
    @NotNull
    @Size(max = 160)
    String title,

    @PastOrPresent
    LocalDate planDate,

    @NotNull
    @Size(max = 8000)
    String notes,

    @NotNull
    @Size(max = 12)
    List<@NotNull @Valid Meal> meals,

    @PositiveOrZero
    Long version
) {
    public record Meal(
        @NotNull
        @Size(max = 80)
        String name,

        @NotNull
        @Size(max = 3000)
        String portions,

        @NotNull
        @Size(max = 3000)
        String substitutions
    ) {}
}