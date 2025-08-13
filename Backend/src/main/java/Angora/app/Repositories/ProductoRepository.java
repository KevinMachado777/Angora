package Angora.app.Repositories;

import Angora.app.Entities.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    // Metodos nuevos
    Producto findTopByOrderByIdProductoDesc();

    // Busca productos segun una categoria
    List<Producto> findByIdCategoriaIdCategoria(Long idCategoria);
}