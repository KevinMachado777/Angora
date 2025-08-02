package Angora.app.Repositories;

import Angora.app.Entities.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {}