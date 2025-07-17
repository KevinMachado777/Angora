package Angora.app.Repositories;

import Angora.app.Entities.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    // Verifica si existe un cliente con el correo dado
    boolean existsByEmail(String email);
    // Verifica si existe un cliente con el ID dado
    boolean existsByIdCliente(Long idCliente);

    boolean existsByEmailAndIdClienteNot(String email, Long idCliente);
}