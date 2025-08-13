package Angora.app.Repositories;

import Angora.app.Entities.LoteUsado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoteUsadoRepository extends JpaRepository<LoteUsado, Long> {
    // Metodos nuevos
    @Query("SELECT lu FROM LoteUsado lu WHERE lu.idProducto = :idProducto ORDER BY lu.fechaProduccion")
    List<LoteUsado> findByIdProducto(@Param("idProducto") Long idProducto);

    @Query("SELECT lu FROM LoteUsado lu WHERE lu.idLote = :idLote ORDER BY lu.fechaProduccion")
    List<LoteUsado> findByIdLote(@Param("idLote") Long idLote);
}
