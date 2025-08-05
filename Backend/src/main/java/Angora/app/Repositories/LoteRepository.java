package Angora.app.Repositories;

import Angora.app.Entities.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoteRepository extends JpaRepository<Lote, Long> {
    void deleteByIdMateria(Long idMateria);
}
