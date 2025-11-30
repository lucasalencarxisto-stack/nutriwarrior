<<<<<<< HEAD
package com.lucas.nutriwarrior.controller;
=======
package com.lucas.nutriwarrior;
>>>>>>> 4e7af82 (Backend estruturado e pronto pra receber seu futuro layout)

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class HealthControllerTest {

    @Autowired
<<<<<<< HEAD
    private MockMvc mvc;
=======
    MockMvc mvc;
>>>>>>> 4e7af82 (Backend estruturado e pronto pra receber seu futuro layout)

    @Test
    void shouldReturnUp() throws Exception {
        mvc.perform(get("/health"))
<<<<<<< HEAD
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.status").value("UP"))
               .andExpect(jsonPath("$.app").value("nutriwarrior"));
=======
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.status").value("UP"))
          .andExpect(jsonPath("$.app").value("nutriwarrior"));
>>>>>>> 4e7af82 (Backend estruturado e pronto pra receber seu futuro layout)
    }
}
