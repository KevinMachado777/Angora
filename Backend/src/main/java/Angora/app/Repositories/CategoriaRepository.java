package Angora.app.Repositories;

import Angora.app.Entities.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// Repositorio de las categorias
@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
  boolean existsByNombre(String nombre);
  Optional<Categoria> findByNombre(String nombre);
}
