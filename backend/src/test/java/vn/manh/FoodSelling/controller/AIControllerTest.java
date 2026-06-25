package vn.manh.FoodSelling.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import vn.manh.FoodSelling.service.AIService;

class AIControllerTest {

    @Test
    void productInfoReturnsMarkdownFromAIService() throws Exception {
        AIService aiService = org.mockito.Mockito.mock(AIService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new AIController(aiService)).build();

        when(aiService.generateProductInfo("Chả mực Hạ Long")).thenReturn("## Chả mực Hạ Long\n\nNội dung AI");

        mockMvc.perform(post("/api/ai/product-info")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productName\":\"Chả mực Hạ Long\"}"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.markdown").value("## Chả mực Hạ Long\n\nNội dung AI"));

        verify(aiService).generateProductInfo("Chả mực Hạ Long");
    }
}
