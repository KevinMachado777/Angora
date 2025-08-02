package Angora.app.Repositories;

import Angora.app.Entities.MateriaPrima;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

// Repositorio para manejar materia prima
@Repository
public interface MateriaPrimaRepository extends JpaRepository<MateriaPrima, Long> {

}