package vn.manh.FoodSelling.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Hiện tại chỉ có 1 cấu hình để cho phép truy cập vào folder uploads, sau này nếu cần thêm cấu hình khác thì có thể thêm vào class này
// Để browser sử dụng image file trong folder uploads
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/");
    }

    // Cấu hình CORS để cho phép frontend có thể gọi API mà không bị lỗi CORS, 
    // chỉ cho phép domain https://myfrontend.com và http://localhost:3000 (dùng khi chạy frontend ở local)
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**") // Áp dụng cho mọi API có tiền tố /api
                        .allowedOrigins("https://myfrontend.com", "http://localhost:3000") // Chỉ cho phép domain này
                        .allowedMethods("GET", "POST", "PUT", "DELETE") // Giới hạn các phương thức
                        .allowedHeaders("*")
                        .allowCredentials(true); // Cho phép gửi kèm Cookie/Token nếu cần
            }
        };

    }
}