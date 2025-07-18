package Angora.app.Config.Filter;

import Angora.app.Utils.JwtUtils;
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

// Filtro que valida si el token es válido
// Se ejecuta en cada solicitud
public class JwtTokenValidator extends OncePerRequestFilter {

    // Utileria para médodos de createToken, validateToken...
    private JwtUtils jwtUtils;

    public JwtTokenValidator(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Obtener token del header Authorization de la solicitud
        String jwtToken = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (jwtToken != null) {

            jwtToken = jwtToken.substring(7);

            // Validar el token
            DecodedJWT decodedJWT = jwtUtils.validateToken(jwtToken);

            // Extraer información del usuario
            String correoUser = jwtUtils.extractEmail(decodedJWT);
            String stringAuthorities = jwtUtils.getSpecificClaim(decodedJWT, "authorities").asString();

            // Convertir authorities a formato de los permisos de Spring Security
            Collection<? extends GrantedAuthority> authorities =
                    AuthorityUtils.commaSeparatedStringToAuthorityList(stringAuthorities);

            // Establecer autenticacion en el contexto de seguridad
            SecurityContext context = SecurityContextHolder.getContext();

            // Objeto de autenticación
            Authentication authentication =
                    new UsernamePasswordAuthenticationToken(correoUser, null, authorities);

            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
        }

        // Continua con los demas filtros
        // Como no hice nada con el token, la autenticacion va a fallar o rechaza la solicitud
        filterChain.doFilter(request, response);
    }
}
