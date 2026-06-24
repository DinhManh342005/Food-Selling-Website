package vn.manh.FoodSelling.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AIService {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String url;
    private final String model;

    public AIService(
            @Value("${ai.groq.api-key:}") String apiKey,
            @Value("${ai.groq.url:https://api.groq.com/openai/v1/chat/completions}") String url,
            @Value("${ai.groq.model:llama3-8b-8192}") String model) {
        this.objectMapper = new ObjectMapper();
        this.restTemplate = new RestTemplate();
        this.apiKey = apiKey;
        this.url = url;
        this.model = model;
    }

    public String generateProductInfo(String productName) {
        if (productName == null || productName.trim().isEmpty()) {
            throw new IllegalArgumentException("Tên sản phẩm không được để trống");
        }
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Thiếu cấu hình ai.groq.api-key để gọi Groq API");
        }

        try {
            String prompt = buildPrompt(productName.trim());
            
            // Format for OpenAI/Groq chat completions
            Map<String, Object> requestBodyMap = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "user", "content", prompt)
                    )
            );
            
            String requestBody = objectMapper.writeValueAsString(requestBodyMap);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new IllegalStateException("Groq API trả về lỗi: HTTP " + response.getStatusCode().value());
            }

            String markdown = extractMarkdown(response.getBody());
            if (markdown.isBlank()) {
                throw new IllegalStateException("Groq API không trả về nội dung phù hợp");
            }
            return markdown;
        } catch (Exception ex) {
            if (ex instanceof IllegalArgumentException || ex instanceof IllegalStateException) {
                throw (RuntimeException) ex;
            }
            throw new IllegalStateException("Không thể gọi Groq API lúc này: " + ex.getMessage(), ex);
        }
    }

    private String buildPrompt(String productName) {
        return """
                Bạn là chuyên gia văn hóa ẩm thực Việt Nam. Hãy giới thiệu đặc sản: %s. 
                
                Yêu cầu trình bày đầy đủ các ý sau: 
                1. Nguồn gốc xuất xứ (Yêu cầu viết dài hơn, chi tiết về lịch sử ra đời, giai thoại hoặc câu chuyện dân gian gắn liền với món ăn).
                2. Vùng miền nổi tiếng.
                3. Nguyên liệu chính.
                4. Quy trình chế biến.
                5. Hương vị đặc trưng.
                6. Cách bảo quản.
                7. Giá trị văn hóa.
                
                Trả lời bằng tiếng Việt. Giới hạn khoảng 300 từ. Trình bày markdown chuyên nghiệp.
                """.formatted(productName);
    }

    private String extractMarkdown(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode choices = root.path("choices");
        if (choices.isArray() && choices.size() > 0) {
            JsonNode message = choices.get(0).path("message");
            return message.path("content").asText("").trim();
        }
        return "";
    }
}
