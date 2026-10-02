package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CareRequest(
    @NotNull UUID requestId,
    @NotNull Kind kind,
    @NotNull @PastOrPresent LocalDate date,
    LocalDate returnDate,
    @NotBlank @Size(max = 160) String title,
    @NotNull @Size(max = 8000) String notes,
    @NotNull @Size(max = 8000) String anamnesis,
    @Size(max = 12) List<@NotNull @Valid Meal> meals,
    @Valid Energy energy,
    @Positive Long consultationId,
    @Size(max = 12) List<@NotBlank @Size(max = 80) String> checklist
) {
    public enum Kind { CONSULTATION, PLAN, ENERGY }
    public record Meal(@NotBlank @Size(max = 80) String name,
        @NotBlank @Size(max = 3000) String portions,
        @NotNull @Size(max = 3000) String substitutions) {}
    public record Energy(
        @NotNull Method method, @NotNull Sex sex,
        @NotNull @DecimalMin(value = "0", inclusive = false) @DecimalMax("1000") Double weightKg,
        @NotNull @DecimalMin(value = "0", inclusive = false) @DecimalMax("300") Double heightCm,
        @NotNull @Min(18) @Max(120) Integer age,
        @DecimalMin("1") @DecimalMax("5") Double activityFactor
    ) {}
    public enum Method { harris1984, mifflin1990 }
    public enum Sex { male, female }
}
