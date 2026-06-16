package vn.manh.FoodSelling.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.manh.FoodSelling.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long>{
    

}
