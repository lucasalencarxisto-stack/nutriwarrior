package com.lucas.nutriwarrior.assistant.command;

import java.math.BigDecimal;

public record WeightCommand(BigDecimal pesoKg) {
    public boolean isValid() {
        return pesoKg != null && pesoKg.compareTo(BigDecimal.ZERO) > 0;
    }
}
