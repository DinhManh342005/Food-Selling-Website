package vn.manh.FoodSelling.config;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Class này sẽ cấu hình ModelMapper, giúp chuyển dổi giữa dữ liệu khác nhau trong ứng dụng.
@Configuration
public class ModelMapperConfig {
    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        // Cấu hình chiến lược khớp tên "STRICT" (Nghiêm ngặt)
        // Bắt buộc các trường phải giống hệt tên nhau mới convert (Ví dụ: productId ->
        // productId)
        // Giúp tránh việc map nhầm dữ liệu giữa các bảng khác nhau khi gom code nhóm
        modelMapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT);

        return modelMapper;
    }
}