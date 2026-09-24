package com.lucas.nutriwarrior.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI nutriWarriorOpenAPI() {
        return new OpenAPI().info(new Info()
            .title("NutriWarrior API")
            .version("Core API MVP")
            .description("API de registro alimentar e acompanhamento nutricional."));
    }
}