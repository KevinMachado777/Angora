package Angora.app.Config;

import Angora.app.Entities.Permiso;
import Angora.app.Entities.Usuario;
import Angora.app.Repositories.PermisoRepository;
import Angora.app.Repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

// Inicializador de registros de prueba en la base de datos
@Component
public class DataInitializer implements CommandLineRunner {

    // Usuario repositorio
    @Autowired
    private UsuarioRepository usuarioRepository;

    // Permiso repositorio
    @Autowired
    private PermisoRepository permisoRepository;

    // Password Encoder
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Método que inicializa permiso
        initializePermisos();
        // Metodo que inicializa Usuarios
        initializeUsuarios();
    }

    // Inicializador de Permisos
    private void initializePermisos() {
        System.out.println("Verificando permisos...");

        // Lista de permisos a crear
        List<Permiso> permisosToCreate = new ArrayList<>();

        // Verificar y crear permiso HOME
        Optional<Permiso> homeExistente = permisoRepository.findByName("HOME");
        if (homeExistente.isEmpty()) {
            Permiso home = Permiso.builder()
                    .name("HOME")
                    .build();
            permisosToCreate.add(home);
            System.out.println("Permiso HOME será creado");
        } else {
            System.out.println("Permiso HOME ya existe");
        }

        // Verificar y crear permiso INVENTARIOS
        Optional<Permiso> inventariosExistente = permisoRepository.findByName("INVENTARIOS");
        if (inventariosExistente.isEmpty()) {
            Permiso inventarios = Permiso.builder()
                    .name("INVENTARIOS")
                    .build();
            permisosToCreate.add(inventarios);
            System.out.println("Permiso INVENTARIOS será creado");
        } else {
            System.out.println("Permiso INVENTARIOS ya existe");
        }

        // Verificar y crear permiso PERSONAL
        Optional<Permiso> personalExistente = permisoRepository.findByName("PERSONAL");
        if (personalExistente.isEmpty()) {
            Permiso personal = Permiso.builder()
                    .name("PERSONAL")
                    .build();
            permisosToCreate.add(personal);
            System.out.println("Permiso PERSONAL será creado");
        } else {
            System.out.println("Permiso PERSONAL ya existe");
        }

        // Verificar y crear permiso VENTAS
        Optional<Permiso> ventasExistente = permisoRepository.findByName("VENTAS");
        if (ventasExistente.isEmpty()) {
            Permiso ventas = Permiso.builder()
                    .name("VENTAS")
                    .build();
            permisosToCreate.add(ventas);
            System.out.println("Permiso VENTAS será creado");
        } else {
            System.out.println("Permiso VENTAS ya existe");
        }

        // Guardar solo los permisos que no existen
        if (!permisosToCreate.isEmpty()) {
            permisoRepository.saveAll(permisosToCreate);
            System.out.println("Se crearon " + permisosToCreate.size() + " permisos nuevos");
        } else {
            System.out.println("Todos los permisos ya existen");
        }
    }

    // Inicializador de Usuarios
    private void initializeUsuarios() {

        createUserIfNotExists(1028140791L,"samuel@example.com", "Samuel", "Rios", "1234", getAllPermisos());
        createUserIfNotExists(1028L, "kevin@example.com", "Kevin", "Machado", "1234", getAllPermisos());

        // Se pueden seguir creando mas usuarios de prueba...
    }

    // Método para crear un usuario si no existe
    private void createUserIfNotExists(Long id, String correo, String nombre, String apellido, String password, List<Permiso> permisos) {
        if (usuarioRepository.findUsuarioByCorreo(correo).isEmpty()) {
            Usuario usuario = Usuario.builder()
                    .id(id)
                    .nombre(nombre)
                    .apellido(apellido)
                    .correo(correo)
                    .contraseña(passwordEncoder.encode(password))
                    .isEnabled(true)
                    .accountNoExpired(true)
                    .accountNoLocked(true)
                    .credentialNoExpired(true)
                    .permisos(permisos)
                    .build();

            usuarioRepository.save(usuario);
            System.out.println("Usuario " + correo + " creado exitosamente");
        } else {
            System.out.println("Usuario " + correo + " ya existe");
        }
    }

    // Método para obtener todos los permisos
    private List<Permiso> getAllPermisos() {
        return permisoRepository.findAll();
    }

}