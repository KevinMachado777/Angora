package Angora.app.Repositories;

import Angora.app.Entities.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    Optional<Proveedor> findByCorreoAndIdProveedorNot(String correo, Long idProveedor);
    List<Proveedor> findByEstadoTrue();
    List<Proveedor> findByEstadoFalse();

}
