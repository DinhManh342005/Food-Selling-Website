package vn.manh.FoodSelling.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Để browser sử dụng image file trong folder uploads
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry
    ) {

        registry
            .addResourceHandler("/uploads/**")
            .addResourceLocations("file:uploads/");
    }
}
