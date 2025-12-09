package com.authsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@ComponentScan(basePackages = {"com.authsystem"})
@EnableMongoRepositories(basePackages = {"com.authsystem.repository"})
public class AuthSystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthSystemApplication.class, args);
    }
}
