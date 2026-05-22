package vn.manh.FoodSelling.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

// Service này dùng để làm upload hình anh cho Product trên server
@Service
public class StorageService {
  private final Path root =
            Paths.get("uploads/products");

    public String save(
            MultipartFile file
    ) throws IOException {

        if (!Files.exists(root)) {
            Files.createDirectories(root);
        }

        String filename =
                UUID.randomUUID()
                + "_"
                + file.getOriginalFilename();

        Path destination =
                root.resolve(filename);

        Files.copy(
                file.getInputStream(),
                destination,
                StandardCopyOption.REPLACE_EXISTING
        );

        return "/uploads/products/" + filename;
    }
}
