package Angora.app.Config;

import Angora.app.Entities.Permiso;
import Angora.app.Entities.Proveedor;
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

// Inicializador de registros de prueba en la base de datos (para desarrollo y pruebas)
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

    @Autowired
    private Angora.app.Repositories.ProveedorRepository proveedorRepository;

    @Override
    public void run(String... args) throws Exception {
        // Método que inicializa permiso
        initializePermisosAndUsuarios();
        initializeProveedores();
    }

    private void initializePermisosAndUsuarios() {
        System.out.println("Verificando permisos...");

        // Lista de permisos a crear
        List<Permiso> permisosToCreate = new ArrayList<>();

        // Crear usuarios con listas de permisos vacías desde el principio
        Usuario kevin = Usuario.builder()
                .id(1041532485L)
                .nombre("Kevin")
                .apellido("Machado")
                .correo("kevin@example.com")
                .contraseña("1234") // Se codifica luego
                .telefono("3196382919")
                .direccion("Urrao")
                .foto("URL_FOTO_USUARIO")
                .permisos(new ArrayList<>()) // <-- lista inicializada
                .build();

        Usuario johan = Usuario.builder()
                .id(1026134871L)
                .nombre("Johan")
                .apellido("Rios")
                .correo("johan@example.com")
                .contraseña("1234")
                .telefono("3002950000")
                .direccion("Versalles")
                .foto("URL_FOTO_USUARIO")
                .permisos(new ArrayList<>())
                .build();

        Usuario samuel = Usuario.builder()
                .id(1028140791L)
                .nombre("Samuel")
                .apellido("Ríos")
                .correo("samuel@example.com")
                .contraseña("1234")
                .telefono("3002955138")
                .direccion("Tamesis")
                .foto("URL_FOTO_USUARIO")
                .permisos(new ArrayList<>())
                .build();

        // Crear y asignar permisos si no existen
        crearYAsignarPermiso("HOME", List.of(samuel, kevin, johan), permisosToCreate);
        crearYAsignarPermiso("DASHBOARD", List.of(kevin, johan), permisosToCreate);
        crearYAsignarPermiso("PERSONAL", List.of(kevin, johan), permisosToCreate);
        crearYAsignarPermiso("INVENTARIOS", List.of(samuel, kevin, johan), permisosToCreate);
        crearYAsignarPermiso("REPORTES", List.of(samuel, kevin, johan), permisosToCreate);
        crearYAsignarPermiso("VENTAS", List.of(kevin, johan), permisosToCreate);
        crearYAsignarPermiso("CLIENTES", List.of(kevin, johan), permisosToCreate);
        crearYAsignarPermiso("PEDIDOS", List.of(samuel, kevin, johan), permisosToCreate);
        crearYAsignarPermiso("PROVEEDORES", List.of(kevin, johan), permisosToCreate);

        // Guardar los nuevos permisos
        if (!permisosToCreate.isEmpty()) {
            permisoRepository.saveAll(permisosToCreate);
            System.out.println("Se crearon " + permisosToCreate.size() + " permisos nuevos");
        } else {
            System.out.println("Todos los permisos ya existen");
        }

        // Guardar usuarios si no existen
        createUserIfNotExists(
                kevin.getId(), kevin.getCorreo(), kevin.getNombre(), kevin.getApellido(),
                kevin.getContraseña(), kevin.getDireccion(), kevin.getFoto(), kevin.getTelefono(), kevin.getPermisos()
        );

        createUserIfNotExists(
                johan.getId(), johan.getCorreo(), johan.getNombre(), johan.getApellido(),
                johan.getContraseña(), johan.getDireccion(), johan.getFoto(), johan.getTelefono(), johan.getPermisos()
        );

        createUserIfNotExists(
                samuel.getId(), samuel.getCorreo(), samuel.getNombre(), samuel.getApellido(),
                samuel.getContraseña(), samuel.getDireccion(), samuel.getFoto(), samuel.getTelefono(), samuel.getPermisos()
        );
    }



    private void initializeProveedores() {
        String nombre = "Proveedor de prueba";
        String correo = "proveedor@example.com";


        Proveedor proveedor = new Proveedor();
        proveedor.setNombre(nombre);
        proveedor.setCorreo(correo);
        proveedor.setTelefono("3000000000");
        proveedor.setDireccion("Calle 123");

        proveedorRepository.save(proveedor);
        System.out.println("Proveedor de prueba creado con éxito.");
    }


    // Método para crear un usuario si no existe
    private void createUserIfNotExists(Long id, String correo, String nombre, String apellido, String password, String direccion, String foto, String telefono, List<Permiso> permisos) {
        if (usuarioRepository.findUsuarioByCorreo(correo).isEmpty()) {
            Usuario usuario = Usuario.builder()
                    .id(id)
                    .nombre(nombre)
                    .apellido(apellido)
                    .correo(correo)
                    .contraseña(passwordEncoder.encode(password))
                    .direccion(direccion)
                    .telefono(telefono)
                    .foto(foto)
                    .permisos(permisos)
                    .isEnabled(true)
                    .accountNoExpired(true)
                    .accountNoLocked(true)
                    .credentialNoExpired(true)
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

    private void crearYAsignarPermiso(String nombrePermiso, List<Usuario> usuarios, List<Permiso> permisosToCreate) {
        Optional<Permiso> existente = permisoRepository.findByName(nombrePermiso);
        if (existente.isEmpty()) {
            Permiso nuevo = Permiso.builder()
                    .name(nombrePermiso)
                    .build();
            permisosToCreate.add(nuevo);
            for (Usuario usuario : usuarios) {
                usuario.getPermisos().add(nuevo);
            }
            System.out.println("Permiso " + nombrePermiso + " será creado");
        } else {
            System.out.println("Permiso " + nombrePermiso + " ya existe");
            Permiso permisoExistente = existente.get();
            for (Usuario usuario : usuarios) {
                usuario.getPermisos().add(permisoExistente);
            }
        }
    }
}