package com.lucas.nutriwarrior.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FoodItemControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCompleteFoodCrud() throws Exception {

        String createBody = """
            {
              "name": "Peito de frango",
              "calories": 165,
              "protein": 31,
              "carbs": 0,
              "fat": 3.6
            }
            """;

        String response = mvc.perform(
                post("/api/foods")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createBody)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.name").value("Peito de frango"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        long id = json.get("id").asLong();

        mvc.perform(get("/api/foods/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.protein").value(31));

        String updateBody = """
            {
              "name": "Peito de frango grelhado",
              "calories": 170,
              "protein": 32,
              "carbs": 0,
              "fat": 4
            }
            """;

        mvc.perform(
                put("/api/foods/{id}", id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(updateBody)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Peito de frango grelhado"))
            .andExpect(jsonPath("$.calories").value(170));

        mvc.perform(delete("/api/foods/{id}", id))
            .andExpect(status().isNoContent());

        mvc.perform(get("/api/foods/{id}", id))
            .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectInvalidFood() throws Exception {

        String body = """
            {
              "name": "",
              "calories": -100,
              "protein": -10,
              "carbs": 0,
              "fat": 0
            }
            """;

        mvc.perform(
                post("/api/foods")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body)
            )
            .andExpect(status().isBadRequest());
    }
}