package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PatientNoteRequest(
    @NotBlank @Size(max = 8000) String content
) {}
