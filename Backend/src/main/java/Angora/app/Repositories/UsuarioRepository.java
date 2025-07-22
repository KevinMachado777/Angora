package Angora.app.Repositories;

import Angora.app.Entities.Usuario;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// Repositorio de Usuario
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findUsuarioByCorreo(String correo);
    boolean existsByCorreo(String correo);

}
