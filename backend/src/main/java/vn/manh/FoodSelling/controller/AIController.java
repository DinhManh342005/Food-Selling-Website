package vn.manh.FoodSelling.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.manh.FoodSelling.dto.request.AIProductInfoRequestDTO;
import vn.manh.FoodSelling.dto.response.AIProductInfoResponseDTO;
import vn.manh.FoodSelling.service.AIService;

@Validated
@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/product-info")
    public ResponseEntity<AIProductInfoResponseDTO> getProductInfo(
            @Valid @RequestBody AIProductInfoRequestDTO request) {
        String markdown = aiService.generateProductInfo(request.getProductName());
        return ResponseEntity.ok(new AIProductInfoResponseDTO(markdown));
    }
}
