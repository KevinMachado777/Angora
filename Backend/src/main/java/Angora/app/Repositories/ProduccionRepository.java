package Angora.app.Repositories;

import Angora.app.Entities.Produccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProduccionRepository extends JpaRepository<Produccion, Long> {
    // Permite obtener la ultima produccion para devoluciones
    @Query("SELECT p FROM Produccion p WHERE p.idProducto = :idProducto ORDER BY p.fecha DESC")
    Optional<Produccion> findTopByIdProductoOrderByFechaDesc(@Param("idProducto") String idProducto);
}
