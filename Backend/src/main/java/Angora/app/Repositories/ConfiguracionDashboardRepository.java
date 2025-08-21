package Angora.app.Repositories;

import Angora.app.Entities.ConfiguracionDashboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracionDashboardRepository extends JpaRepository<ConfiguracionDashboard, Long> {

    // Obtener la configuración activa (debe haber solo una)
    Optional<ConfiguracionDashboard> findByActivoTrue();

    // Verificar si existe una configuración activa
    boolean existsByActivoTrue();

    // Obtener la primera configuración (para casos donde no hay activo marcado)
    @Query("SELECT c FROM ConfiguracionDashboard c ORDER BY c.id DESC")
    Optional<ConfiguracionDashboard> findLatest();
}