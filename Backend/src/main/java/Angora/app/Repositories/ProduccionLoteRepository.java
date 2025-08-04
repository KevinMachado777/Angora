package Angora.app.Repositories;

import Angora.app.Entities.ProduccionLote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProduccionLoteRepository extends JpaRepository<ProduccionLote, Long> {
}
