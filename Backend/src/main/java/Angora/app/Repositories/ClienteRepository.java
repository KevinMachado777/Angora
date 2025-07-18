package Angora.app.Repositories;

import Angora.app.Entities.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// Repositorio para manejar clientes en la base de datos
@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    // Verifica si hay un cliente con ese ID en la BD
    boolean existsByIdCliente(Long idCliente);

    // Verifica si el correo ya está usado por otro cliente (excluye el ID dado)
    boolean existsByEmailAndIdClienteNot(String email, Long idCliente);

    // Verifica si hay un cliente inactivo con ese ID
    boolean existsByIdClienteAndActivoFalse(Long idCliente);

    // Verifica si hay un cliente inactivo con ese correo
    boolean existsByEmailAndActivoFalse(String email);

    // Busca un cliente por ID y si está activo o inactivo
    Optional<Cliente> findByIdClienteAndActivo(Long idCliente, Boolean activo);

    // Obtiene todos los clientes inactivos
    List<Cliente> findByActivoFalse();

    // Obtiene todos los clientes activos
    List<Cliente> findByActivoTrue();

    // Busca un cliente por su correo
    Optional<Cliente> findByEmail(String email);

    // Verifica si el correo ya está en la BD
    boolean existsByEmail(String email);
}