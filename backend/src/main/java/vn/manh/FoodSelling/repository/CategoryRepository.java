package vn.manh.FoodSelling.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.manh.FoodSelling.entity.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long>{
    

}
