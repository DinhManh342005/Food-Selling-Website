
package vn.manh.FoodSelling.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.manh.FoodSelling.dto.response.ImageUploadResponse;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private final Cloudinary cloudinary;

    public ImageUploadResponse save(MultipartFile file) throws IOException {
        validate(file);

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "food-selling/products",
                        "resource_type", "image",
                        "unique_filename", true,
                        "overwrite", false
                )
        );

        String imageUrl = String.valueOf(result.get("secure_url"));
        String publicId = String.valueOf(result.get("public_id"));

        return new ImageUploadResponse(imageUrl, publicId);
    }

    public void delete(String publicId) throws IOException {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        cloudinary.uploader().destroy(
                publicId,
                ObjectUtils.asMap(
                        "resource_type", "image",
                        "invalidate", true
                )
        );
    }

    private void validate(MultipartFile file) throws IOException {
    if (file == null || file.isEmpty()) {
        throw new IllegalArgumentException(
                "Vui lòng chọn ảnh sản phẩm"
        );
    }

    if (file.getSize() > MAX_FILE_SIZE) {
        throw new IllegalArgumentException(
                "Ảnh không được vượt quá 5 MB"
        );
    }

    String detectedType = detectImageType(file);

    if (detectedType == null) {
        throw new IllegalArgumentException(
                "File tải lên không phải JPG, JPEG, PNG hoặc WEBP hợp lệ"
        );
    }

    System.out.println("Tên file: " + file.getOriginalFilename());
    System.out.println("Content-Type client gửi: " + file.getContentType());
    System.out.println("Loại ảnh thực tế: " + detectedType);
    System.out.println("Dung lượng: " + file.getSize() + " bytes");
    }
    private String detectImageType(MultipartFile file) throws IOException {
    byte[] header;

    try (var inputStream = file.getInputStream()) {
        header = inputStream.readNBytes(12);
    }

    // JPEG bắt đầu bằng FF D8 FF
    if (header.length >= 3
            && (header[0] & 0xFF) == 0xFF
            && (header[1] & 0xFF) == 0xD8
            && (header[2] & 0xFF) == 0xFF) {
        return "image/jpeg";
    }

    // PNG bắt đầu bằng 89 50 4E 47 0D 0A 1A 0A
    if (header.length >= 8
            && (header[0] & 0xFF) == 0x89
            && header[1] == 0x50
            && header[2] == 0x4E
            && header[3] == 0x47
            && header[4] == 0x0D
            && header[5] == 0x0A
            && header[6] == 0x1A
            && header[7] == 0x0A) {
        return "image/png";
    }

    // WEBP có RIFF ở đầu và WEBP tại vị trí 8–11
    if (header.length >= 12
            && header[0] == 'R'
            && header[1] == 'I'
            && header[2] == 'F'
            && header[3] == 'F'
            && header[8] == 'W'
            && header[9] == 'E'
            && header[10] == 'B'
            && header[11] == 'P') {
        return "image/webp";
    }

    return null;
}
}
