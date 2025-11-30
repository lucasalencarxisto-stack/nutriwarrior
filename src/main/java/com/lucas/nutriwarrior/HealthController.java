<<<<<<< HEAD
package com.lucas.nutriwarrior.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {
    
=======
package com.lucas.nutriwarrior;

import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
>>>>>>> 4e7af82 (Backend estruturado e pronto pra receber seu futuro layout)
    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "status", "UP",
            "timestamp", Instant.now().toString(),
            "app", "nutriwarrior"
        );
    }
}
