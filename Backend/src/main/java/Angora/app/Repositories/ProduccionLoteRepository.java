package Angora.app.Repositories;

import Angora.app.Entities.ProduccionLote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProduccionLoteRepository extends JpaRepository<ProduccionLote, Long> {
    // Metodo nuevo
    // Permite vincular lotes a producciones especificas
    @Query("SELECT pl FROM ProduccionLote pl WHERE pl.idProduccion = :idProduccion AND pl.idLote = :idLote")
    List<ProduccionLote> findByIdProduccionAndIdLote(@Param("idProduccion") Long idProduccion, @Param("idLote") Long idLote);
}
