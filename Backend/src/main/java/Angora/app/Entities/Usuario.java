package Angora.app.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Usuario {

    @Id
    private Long id;
    private String nombre;
    private String apellido;
    @Column(unique = true)
    @Email
    private String correo;
    @Column(name = "is_enabled")
    private Boolean isEnabled;

    // Indica si la cuenta no está expirada
    @Column(name = "account_no_expired")
    private Boolean accountNoExpired;

    // Indica si la cuenta no está bloqueada
    @Column(name = "account_no_locked")
    private Boolean accountNoLocked;

    // Indica si las credenciales (como la contraseña) no están expiradas
    @Column(name = "credential_no_expired")
    private Boolean credentialNoExpired;

    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinTable(
            name = "usuario_permisos", // Nombre de la tabla intermedia
            joinColumns = @JoinColumn(name = "Id"), // Columna que hace referencia al usuario
            inverseJoinColumns = @JoinColumn(name = "id_permiso") // Columna que hace referencia a los permisos
    )

    private Set<Permiso> permiso= new HashSet<>();
}
