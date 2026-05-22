package vn.manh.FoodSelling.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import vn.manh.FoodSelling.entity.ProductImage;
import vn.manh.FoodSelling.service.StorageService;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;


// Controller cho upload hình anh cho Product
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private StorageService storageService;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file")
    MultipartFile file) throws IOException {
        String imageUrl =
                storageService.save(file);

        return ResponseEntity.ok(imageUrl);
    }
}