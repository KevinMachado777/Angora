package Angora.app.Repositories;

import Angora.app.Entities.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// Repositorio Recuperar Contraseñas
@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {
    PasswordReset findByCorreo(String email);
    void deleteByCorreo(String correo);
    void deleteAllByCorreo(String correo);
}
