package vn.manh.FoodSelling.config;

import org.springframework.context.annotation.Configuration;
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
}
