package Angora.app.Services;

import Angora.app.Entities.RefreshToken;
import Angora.app.Entities.Usuario;
import Angora.app.Repositories.RefreshTokenRepository;
import Angora.app.Repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

// Servicio Refresh Token
@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Value("${security.jwt.refresh.duration:7200000}") // 2 horas por defecto
    private Long refreshTokenDuration;

    // Crea el refresh token
    @Transactional
    public RefreshToken createRefreshToken(String correo){
        Usuario usuario = usuarioRepository.findUsuarioByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Revocar tokens existentes del usuario
        refreshTokenRepository.revokeTokensByUsuario(usuario);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshTokenDuration))
                .usuario(usuario)
                .isRevoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    // Verifica la expiración del token
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0 || token.getIsRevoked()) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token expirado o revocado");
        }
        return token;
    }

    // Método para remover el refresh token viejo por el nuevo
    @Transactional
    public void revokeToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token no encontrado"));
        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }

    // Limpiar los tokens
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredTokens(Instant.now());
    }
}
