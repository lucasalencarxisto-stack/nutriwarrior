package com.lucas.nutriwarrior.assistant.command;

public record WaterCommand(int quantidadeMl) {
    public boolean isValid() {
        return quantidadeMl > 0;
    }
}
