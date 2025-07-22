package Angora.app.Repositories;

import Angora.app.Entities.Cartera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// Repositorio para manejar carteras en la base de datos
@Repository
public interface CarteraRepository extends JpaRepository<Cartera, Long> {

    // Busca la cartera de un cliente por su ID
    Cartera findByIdCliente_IdCliente(Long idCliente);

    // Obtiene todas las carteras activas
    List<Cartera> findByEstadoTrue();
}