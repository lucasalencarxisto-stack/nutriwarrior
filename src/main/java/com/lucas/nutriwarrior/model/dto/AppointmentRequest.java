package com.lucas.nutriwarrior.model.dto;

import jakarta.validation.constraints.Size;
import java.time.Instant;

public record AppointmentRequest(
    Instant startsAt,
    @Size(max = 20) String status,
    @Size(max = 4000) String notes
) {}
