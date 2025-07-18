package Angora.app.Utils;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.Claim;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// Componente de utilería patra trabajar con JWT
@Component
public class JwtUtils {

    // Llave privada
    @Value("${security.jwt.key.private}")
    private String privateKey;

    // Usuario generador del token (backend)
    @Value("${security.jwt.user.generator}")
    private String userGenerator;

    // Método para crear el token
    public String createToken(Authentication authentication){

        // ALgoritmo de encriptación
        Algorithm algorithm = Algorithm.HMAC256(this.privateKey);

        // Extraemos el usuario (correo) que se va a autenticar
        String correoUser = authentication.getPrincipal().toString();

        // Extraemos los permisos en un string separados por comas
        String authorities = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        // Generamos el token
        String jwtToken = JWT.create()
                // Quien lo genera (backend)
                .withIssuer(this.userGenerator)
                // A quien se le genera (usuario)
                .withSubject(correoUser)
                // Permisos
                .withClaim("authorities", authorities)
                // Fecha de creacion (actual)
                .withIssuedAt(new Date())
                // Fecha de expiracion (30 minutos después de la fecha de creación)
                .withExpiresAt(new Date(System.currentTimeMillis() + 1800000))
                // Id random al token
                .withJWTId(UUID.randomUUID().toString())
                // Valido a partir de la fecha actual o de creación
                .withNotBefore(new Date(System.currentTimeMillis()))
                // Firma
                .sign(algorithm);

        return jwtToken;
    }

    // Método para validar el token
    public DecodedJWT validateToken(String token){

        try {
            // Algoritmo de encriptación
            Algorithm algorithm = Algorithm.HMAC256(this.privateKey);

            // Verificador del token
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer(this.userGenerator)
                    .build();

            DecodedJWT decodedJWT = verifier.verify(token);

            return decodedJWT;

        } catch (JWTVerificationException exception) {
            // Sí el token es inválido, salta a la excepcion
            throw new JWTVerificationException("Token inválido, no autorizado");
        }
    }

    // Extraer correo del usaurio del token decodificado
    public String extractEmail(DecodedJWT decodedJWT){
        return decodedJWT.getSubject();
    }

    // Obtener claim especifico
    public Claim getSpecificClaim(DecodedJWT decodedJWT, String claimName){
        return decodedJWT.getClaim(claimName);
    }

    // Obtener todos los claims
    public Map<String, Claim> getAllClaims(DecodedJWT decodedJWT){
        return decodedJWT.getClaims();
    }

}
