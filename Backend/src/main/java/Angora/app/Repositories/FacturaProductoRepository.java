package Angora.app.Repositories;

import Angora.app.Entities.FacturaProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FacturaProductoRepository extends JpaRepository<FacturaProducto, Long> {
}