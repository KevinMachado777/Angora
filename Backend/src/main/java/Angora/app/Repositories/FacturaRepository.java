package Angora.app.Repositories;

import Angora.app.Entities.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacturaRepository extends JpaRepository<Factura, Long> {
    // Metodo para listar facturas por una cartera en especifico
    @Query("SELECT f FROM Factura f WHERE f.idCartera.idCartera = :idCartera")
    List<Factura> findByIdCarteraIdCartera(@Param("idCartera") Long idCartera);

    // Metodo para saber si una cartera con es id existe, esto para procesar abonos por cada una
    boolean existsByIdFactura(Long idFactura);
}