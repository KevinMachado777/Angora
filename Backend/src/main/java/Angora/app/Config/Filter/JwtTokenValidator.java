package Angora.app.Config.Filter;

import Angora.app.Utils.JwtUtils;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;

public class JwtTokenValidator extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public JwtTokenValidator(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Ignorar validación para endpoints bajo /auth/**
        String path = request.getRequestURI();
        if (path.startsWith("/angora/api/v1/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Obtener token del encabezado Authorization
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwtToken = authHeader.substring(7); // Quitar "Bearer "

            try {
                // Validar token y decodificarlo
                DecodedJWT decodedJWT = jwtUtils.validateToken(jwtToken);

                // Extraer email del usuario desde el token
                String correoUser = jwtUtils.extractEmail(decodedJWT);

                // Extraer permisos (roles) desde el token
                String stringAuthorities = jwtUtils.getSpecificClaim(decodedJWT, "authorities").asString();

                // Convertir a lista de GrantedAuthority compatible con Spring Security
                Collection<? extends GrantedAuthority> authorities =
                        AuthorityUtils.commaSeparatedStringToAuthorityList(stringAuthorities);

                // Crear el objeto de autenticación
                Authentication authentication =
                        new UsernamePasswordAuthenticationToken(correoUser, null, authorities);

                // Establecer la autenticación en el contexto de seguridad
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);

            } catch (JWTVerificationException e) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token inválido o expirado");
                return;
            }
        }

        // Continuar con los demás filtros de la cadena
        filterChain.doFilter(request, response);
    }
}