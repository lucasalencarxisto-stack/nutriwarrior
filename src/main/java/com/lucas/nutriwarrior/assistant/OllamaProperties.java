package com.lucas.nutriwarrior.assistant;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@Validated
@Component
@ConfigurationProperties(prefix = "app.ollama")
public class OllamaProperties {

    @NotBlank
    private String baseUrl = "http://localhost:11434";
    @NotBlank
    private String model = "qwen2.5:1.5b";
    @Positive
    private int timeoutSeconds = 60;
    @NotBlank
    private String keepAlive = "10m";

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public String getKeepAlive() {
        return keepAlive;
    }

    public void setKeepAlive(String keepAlive) {
        this.keepAlive = keepAlive;
    }
}