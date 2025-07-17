package Angora.app.Repositories;

import Angora.app.Entities.Permiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// Repositorio de permiso
@Repository
public interface PermisoRepository extends JpaRepository<Permiso, Long>  {
    Optional<Permiso> findByName(String nombre);
}
