package Angora.app.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Usuario {

    @Id
    @Column(name = "id")
    private Long id;

    private String nombre;

    private String apellido;

    @Column(unique = true)
    @Email
    private String correo;

    private String contraseña;

    private String telefono;

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

    // Permisos del usuario
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "usuario_permisos",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "permiso_id")
    )
    private List<Permiso> permisos = new ArrayList<>();

    private String foto;

}
