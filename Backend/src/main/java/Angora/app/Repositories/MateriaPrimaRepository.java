package Angora.app.Repositories;

import Angora.app.Entities.MateriaPrima;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MateriaPrimaRepository extends JpaRepository<MateriaPrima, Long> {
    List<MateriaPrima> findAll();
}