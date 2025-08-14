package Angora.app.Repositories;

import Angora.app.Entities.OrdenMateriaPrima;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrdenMateriaPrimaRepository extends JpaRepository<OrdenMateriaPrima, Long> {
}
