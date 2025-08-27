package Angora.app.Repositories;

import Angora.app.Entities.MateriaPrima;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MateriaPrimaRepository extends JpaRepository<MateriaPrima, String> {
    Optional<MateriaPrima> findByNombre(String nombreMateria);

    // Agregar este método para buscar por ID
    @Query("SELECT m FROM MateriaPrima m WHERE m.idMateria = :id")
    Optional<MateriaPrima> findByIdMateria(@Param("id") String id);

    void deleteByid(String id);
}