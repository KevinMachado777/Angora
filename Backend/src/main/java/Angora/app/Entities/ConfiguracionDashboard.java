package Angora.app.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "configuracion_dashboard")
public class ConfiguracionDashboard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "correo_destinatario", nullable = false)
    private String correoDestinatario;

    @Column(name = "hora_envio", nullable = false)
    private LocalTime horaEnvio;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "ultimo_envio")
    private java.time.LocalDateTime ultimoEnvio;
}