package Angora.app.Repositories;

import Angora.app.Entities.Usuario;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

// Repositorio de Usuario
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Busca un usuario por su correo
    Optional<Usuario> findUsuarioByCorreo(String correo);


    // Lista a todos los empleados que hayan realizado ventas
    @Query("SELECT u FROM Usuario u JOIN Factura f ON u.id = f.cajero.id WHERE f.fecha IS NOT NULL")
    List<Usuario> findUsuariosConVentas();

    // Verifica si un correo existe
    boolean existsByCorreo(String correo);
}
