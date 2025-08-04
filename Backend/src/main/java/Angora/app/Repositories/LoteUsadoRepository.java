package Angora.app.Repositories;

import Angora.app.Entities.LoteUsado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoteUsadoRepository extends JpaRepository<LoteUsado, Long> {
}
