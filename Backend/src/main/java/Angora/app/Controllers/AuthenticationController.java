package Angora.app.Controllers;

import Angora.app.Controllers.dto.AuthCreateUserRequest;
import Angora.app.Controllers.dto.AuthLoginRequest;
import Angora.app.Controllers.dto.AuthResponse;
import Angora.app.Controllers.dto.RefreshTokenRequest;
import Angora.app.Entities.RefreshToken;
import Angora.app.Services.RefreshTokenService;
import Angora.app.Services.UserDetailService;
import Angora.app.Utils.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

// Controlador para la autenticación y registro de usuarios
@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    // Servicio del UserDetailService
    @Autowired
    private UserDetailService userDetailService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private JwtUtils jwtUtils;

    // Método para autenticar y autorizar un usuario
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid AuthLoginRequest authLogin){

        AuthResponse authResponse = userDetailService.loginUser(authLogin);

        return new ResponseEntity<>(authResponse, HttpStatus.OK);
    }

    // Método que refresca el token
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody @Valid RefreshTokenRequest refreshTokenRequest){
        try {

            String requestRefreshToken = refreshTokenRequest.refreshToken();

            RefreshToken refreshToken = refreshTokenService.findByToken(requestRefreshToken)
                    .orElseThrow(() -> new RuntimeException("Refresh token no encontrado"));

            refreshToken = refreshTokenService.verifyExpiration(refreshToken);

            // Crear nuevo access token
            UserDetails userDetails = userDetailService.loadUserByUsername(refreshToken.getUsuario().getCorreo());

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );

            String newAccessToken = jwtUtils.createAccessToken(authentication);

            // Crear nuevo refresh token
            RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(refreshToken.getUsuario().getCorreo());

            AuthResponse authResponse = new AuthResponse(
                    refreshToken.getUsuario().getCorreo(),
                    "Token renovado correctamente",
                    newAccessToken,
                    newRefreshToken.getToken(),
                    true
            );

            return new ResponseEntity<>(authResponse, HttpStatus.OK);

        } catch (RuntimeException e) {
            return new ResponseEntity<>(
                    new AuthResponse(
                            null,
                            "Error al renovar token: " + e.getMessage(),
                            null,
                            null,
                            false), HttpStatus.UNAUTHORIZED
            );
        }
    }

    // Endpoint que elimina el token cuando cierran sesión
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestBody RefreshTokenRequest refreshTokenRequest) {
        try {
            refreshTokenService.revokeToken(refreshTokenRequest.refreshToken());
            return ResponseEntity.ok("Sesión cerrada correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error al cerrar sesión: " + e.getMessage());
        }
    }

}