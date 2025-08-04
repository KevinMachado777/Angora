package Angora.app.Config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {
    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "dtmtmn3cu",
                "api_key", "872139437673244",
                "api_secret", "yDoRmi_Iy20XU0GGs2dzljnkYJQ"));
    }
}