package com.example.booking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * The React dev server (localhost:5173) and this API (localhost:8080) are
 * different origins as far as the browser is concerned, even though both
 * are "localhost" - the port counts. Without this, every fetch() call
 * from React would be silently blocked by the browser's CORS policy
 * before it even reaches these controllers.
 *
 * Allowed origins are listed explicitly rather than using "*" because
 * credentials/cookies-bearing requests can't use a wildcard origin.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
