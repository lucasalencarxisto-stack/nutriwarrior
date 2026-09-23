package com.lucas.nutriwarrior.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FoodItemControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void shouldCreateAndListFoodItem() throws Exception {

        String body = """
            {
              "name": "Peito de frango",
              "calories": 165,
              "protein": 31,
              "carbs": 0,
              "fat": 3.6
            }
            """;

        mvc.perform(
                post("/api/foods")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.name").value("Peito de frango"))
            .andExpect(jsonPath("$.calories").value(165))
            .andExpect(jsonPath("$.protein").value(31));

        mvc.perform(get("/api/foods"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Peito de frango"));
    }
}
