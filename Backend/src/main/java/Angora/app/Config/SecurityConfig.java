package Angora.app.Config;

import Angora.app.Config.Filter.JwtTokenValidator;
import Angora.app.Services.UserDetailService;
import Angora.app.Utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import java.util.ArrayList;
import java.util.List;

// Configurar la arquitectura de Spring Security
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // Servicio de UserDetailsService
    @Autowired
    private UserDetailService userDetailService;

    // PasswordEncoder
    @Autowired
    private PasswordEncoder passwordEncoder;

    // Filtro
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity, JwtUtils jwtUtils) throws Exception {

        // Falta completar el filtro
        return httpSecurity
                .cors(Customizer.withDefaults()) // Habilitar CORS
                // Desactiva CSRF (protección contra ataques Cross-Site Request Forgery)
                .csrf(csrf -> csrf.disable())
                // Usa autenticación HTTP básica (usuario y contraseña en el encabezado Authorization)
                .httpBasic(Customizer.withDefaults())
                // Define que la aplicación no mantendrá sesiones de usuario (stateless)
                // Útil para APIs que usan tokens como JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(http -> {
                    // Configurar endpoints públicos
                    // Rutas protegidas de Auth
                    http.requestMatchers(HttpMethod.POST, "/auth/**").permitAll();
                    http.requestMatchers(HttpMethod.GET, "/auth/**").permitAll();
                    http.requestMatchers(HttpMethod.POST, "/user/{correo}").permitAll();


                    // Rutas protegidas de Portafolio
                    http.requestMatchers(HttpMethod.GET, "/clientes/**").permitAll();
                    http.requestMatchers(HttpMethod.POST, "/clientes").permitAll();
                    http.requestMatchers(HttpMethod.PUT, "/clientes/**").permitAll();
                    http.requestMatchers(HttpMethod.OPTIONS, "/clientes/**").permitAll();
                    // Configurar endpoints privados

                    // Rutas protegidas de Personal
                    http.requestMatchers(HttpMethod.GET, "/user/public/**").permitAll();
                    http.requestMatchers(HttpMethod.POST, "/user/**").hasAuthority("PERSONAL");
                    http.requestMatchers(HttpMethod.GET, "/user/**").hasAuthority("PERSONAL");

                    // Rutas protegidas de Cartera
                    http.requestMatchers(HttpMethod.GET, "/carteras/**").permitAll();
                    http.requestMatchers(HttpMethod.POST, "/carteras/**").permitAll();
                    http.requestMatchers(HttpMethod.PUT, "/carteras/**").permitAll();
                    http.requestMatchers(HttpMethod.OPTIONS, "/carteras/**").permitAll();

                    // Rutas de reportes
                    http.requestMatchers(HttpMethod.GET, "/reportes/**").hasAuthority("REPORTES");

                    // Rutas de perfil
                    http.requestMatchers(HttpMethod.PUT, "/user").permitAll();
                    http.requestMatchers(HttpMethod.GET, "/user/exists/**").permitAll();



                    http.anyRequest().denyAll();
                })
                .addFilterBefore(new JwtTokenValidator(jwtUtils), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration
                configuration = new org.springframework.web.cors.CorsConfiguration();

        // Qué orígenes permitir
        configuration.addAllowedOrigin("http://localhost:5173");
        configuration.setAllowCredentials(true);
        configuration.addAllowedHeader("*"); // Permitir todos los headers
        configuration.addAllowedMethod("*"); // Permitir todos los métodos

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Aplica a todos los endpoints
        return source;
    }

    // Authentication Manager, encargado de la autenticacion
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception{
        return authenticationConfiguration.getAuthenticationManager();
    }

    // Elegir la forma de logueo de los usuarios (consulta a la base de datos con el passwordEncoder)
    @Bean
    public AuthenticationProvider authenticationProvider (UserDetailsService userDetailsService){

        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();

        provider.setPasswordEncoder(passwordEncoder);
        provider.setUserDetailsService(userDetailsService);

        return provider;

    }

}