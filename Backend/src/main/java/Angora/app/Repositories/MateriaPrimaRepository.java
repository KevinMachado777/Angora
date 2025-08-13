package Angora.app.Repositories;

import Angora.app.Entities.MateriaPrima;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// Repositorio para manejar materia prima
@Repository
public interface MateriaPrimaRepository extends JpaRepository<MateriaPrima, Long> {
    // Tipo de dato cambiado a Materia, antes era Object
    Optional<MateriaPrima> findByNombre(String nombreMateria);
}