package Angora.app.Config;


import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/angora/api/v1/**") // Todos los enpoints aplica
                .allowedOrigins("http://localhost:5173") // Frontend
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*") // Permite autorizacion y otros headers
                .exposedHeaders("Authorization") // Expone el token
                .allowCredentials(true); // Necesario para las cookies y cabecero Authorization
    }

}
