package vn.manh.FoodSelling.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import vn.manh.FoodSelling.entity.Order;


public interface OrderRepository extends JpaRepository<Order, Long>{
        
}
