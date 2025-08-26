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
                    http.requestMatchers(HttpMethod.GET, "/clientes/**").hasAnyAuthority("CLIENTES", "VENTAS");
                    http.requestMatchers(HttpMethod.POST, "/clientes").hasAuthority("CLIENTES");
                    http.requestMatchers(HttpMethod.PUT, "/clientes/**").hasAuthority("CLIENTES");
                    http.requestMatchers(HttpMethod.OPTIONS, "/clientes/**").hasAuthority("CLIENTES");

                    // Rutas de perfil
                    http.requestMatchers(HttpMethod.PUT, "/user/perfil").permitAll();
                    http.requestMatchers(HttpMethod.GET, "/user/exists/**").permitAll();

                    // Rutas protegidas de Personal
                    http.requestMatchers(HttpMethod.POST, "/user/**").hasAuthority("PERSONAL");
                    http.requestMatchers(HttpMethod.GET, "/user/**").hasAuthority("PERSONAL");
                    http.requestMatchers(HttpMethod.PUT, "/user/**").hasAuthority("PERSONAL");
                    http.requestMatchers(HttpMethod.DELETE, "/user/**").hasAuthority("PERSONAL");

                    // Rutas protegidas de Cartera
                    http.requestMatchers(HttpMethod.GET, "/carteras/**").hasAnyAuthority("CLIENTES", "VENTAS");
                    http.requestMatchers(HttpMethod.POST, "/carteras/**").hasAuthority("CLIENTES");
                    http.requestMatchers(HttpMethod.PUT, "/carteras/**").hasAuthority("CLIENTES");
                    http.requestMatchers(HttpMethod.OPTIONS, "/carteras/**").hasAuthority("CLIENTES");
                    http.requestMatchers(HttpMethod.GET, "/carteras/{idCliente}/historial").hasAuthority("CLIENTES");


                    // Rutas de reportes
                    http.requestMatchers(HttpMethod.GET, "/reportes/**").hasAuthority("REPORTES");

                    // Rutas del inventario de productos
                    http.requestMatchers(HttpMethod.GET, "/inventarioProducto/**").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.POST, "/inventarioProducto").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.PUT, "/inventarioProducto/{id}").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.PUT, "/inventarioProducto/{id}/stock").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.PUT, "/inventarioProducto/{id}/disminuir-stock").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.DELETE, "/inventarioProducto/**").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.GET, "/inventarioMateria/**").hasAuthority("INVENTARIOS");

                    // Rutas de las categorias
                    http.requestMatchers(HttpMethod.GET, "/categorias/**").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.POST, "/categorias").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.PUT, "/categorias/**").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.DELETE, "/categorias/**").hasAuthority("INVENTARIOS");

                    // Rutas de lotes
                    http.requestMatchers(HttpMethod.GET, "/lotes-usados/**").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.GET, "/lotes/**").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.POST, "/lotes").hasAnyAuthority("INVENTARIOS", "PROVEEDORES");
                    http.requestMatchers(HttpMethod.PUT, "/lotes/**").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.DELETE, "/lotes/**").denyAll();

                    // Rutas de producion
                    http.requestMatchers(HttpMethod.GET, "/producciones/**").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.GET, "/producciones-lotes/**").hasAuthority("INVENTARIOS");

                    // Rutas de inventarios materias
                    http.requestMatchers(HttpMethod.GET, "/inventarioMateria/**").hasAnyAuthority("INVENTARIOS", "PROVEEDORES");
                    http.requestMatchers(HttpMethod.POST, "/inventarioMateria/**").hasAnyAuthority("INVENTARIOS", "PROVEEDORES");
                    http.requestMatchers(HttpMethod.PUT, "/inventarioMateria/**").hasAuthority("INVENTARIOS");
                    http.requestMatchers(HttpMethod.DELETE, "/inventarioMateria/**").denyAll();

                    // Rutas de ventas
                    http.requestMatchers(HttpMethod.POST, "/ventas/**").permitAll();
                    http.requestMatchers(HttpMethod.GET,"/activos-con-cartera/**").hasAnyAuthority("CLIENTES", "VENTAS");

                    // Rutas de pedidos
                    http.requestMatchers(HttpMethod.DELETE,"/pedidos/**").hasAuthority("PEDIDOS");
                    http.requestMatchers(HttpMethod.GET,"/pedidos/pendientes").hasAuthority("PEDIDOS");
                    http.requestMatchers(HttpMethod.PUT,"/pedidos/confirmar/**").hasAuthority("PEDIDOS");
                    http.requestMatchers(HttpMethod.POST,"/pedidos/enviar-factura/**").hasAuthority("PEDIDOS");

                    // Rutas para recuperar contraseña
                    http.requestMatchers(HttpMethod.GET, "/passwordReset/**").permitAll();
                    http.requestMatchers(HttpMethod.POST, "/passwordReset/**").permitAll();
                    http.requestMatchers(HttpMethod.DELETE, "/passwordReset/**").permitAll();

                    // Proveedores
                    http.requestMatchers(HttpMethod.GET,"/proveedores/**").hasAnyAuthority("PROVEEDORES", "INVENTARIOS");
                    http.requestMatchers(HttpMethod.POST,"/proveedores/**").hasAuthority("PROVEEDORES");
                    http.requestMatchers(HttpMethod.PUT,"/proveedores/**").hasAuthority("PROVEEDORES");
                    http.requestMatchers(HttpMethod.DELETE,"/proveedores/**").hasAuthority("PROVEEDORES");

                    // Ordenes
                    http.requestMatchers(HttpMethod.GET,"/ordenes/**").hasAuthority("PROVEEDORES");
                    http.requestMatchers(HttpMethod.GET,"/ordenes/pendientes/**").hasAuthority("PROVEEDORES");
                    http.requestMatchers(HttpMethod.POST,"/ordenes/**").hasAuthority("PROVEEDORES");
                    http.requestMatchers(HttpMethod.POST,"/ordenes/enviar-orden").hasAuthority("PROVEEDORES");
                    http.requestMatchers(HttpMethod.DELETE,"/ordenes/**").hasAuthority("PROVEEDORES");
                    http.requestMatchers(HttpMethod.PUT,"/ordenes/**").hasAuthority("PROVEEDORES");

                    // Dashboard
                    http.requestMatchers(HttpMethod.GET,"/dashboard/**").hasAuthority("DASHBOARD");
                    http.requestMatchers(HttpMethod.POST,"/dashboard/**").hasAuthority("DASHBOARD");

                    // Lotes
                    http.requestMatchers(HttpMethod.GET, "/lotes/ultimo/**").hasAuthority("PROVEEDORES");
                    http.requestMatchers(HttpMethod.POST, "/ordenes/confirmar/**").hasAuthority("PROVEEDORES"); // o permitAll según tu política
                    http.requestMatchers(HttpMethod.POST, "/lotes/**").hasAuthority("INVENTARIOS");

                    // Rutas de Swagger/OpenAPI para documentación
                    http.requestMatchers("/swagger-ui/**").permitAll();
                    http.requestMatchers("/swagger-ui.html").permitAll();
                    http.requestMatchers("/v3/api-docs/**").permitAll();
                    http.requestMatchers("/swagger-resources/**").permitAll();
                    http.requestMatchers("/webjars/**").permitAll();

                    // El resto necesita autenticacion
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