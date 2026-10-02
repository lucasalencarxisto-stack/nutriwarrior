package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PlanTemplateRequest(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Size(max = 160) String title,
    @NotNull @Size(max = 8000) String notes,
    @NotNull @Size(min = 1, max = 12) List<@NotNull @Valid CareRequest.Meal> meals
) {}
