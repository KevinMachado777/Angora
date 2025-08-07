package Angora.app.Config;

import Angora.app.Controllers.dto.CategoriaIdDTO;
import Angora.app.Controllers.dto.MateriaProductoDTO;
import Angora.app.Controllers.dto.ProductoDTO;
import Angora.app.Entities.*;
import Angora.app.Repositories.*;
import Angora.app.Services.ProductoService;
import Angora.app.Services.ProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PermisoRepository permisoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MateriaPrimaRepository materiaPrimaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private MateriaProductoRepository materiaProductoRepository;

    @Autowired
    private ProductoService productoService;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private ProveedorService proveedorService;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        initializePermisosAndUsuarios(); // Permisos y usuarios
        initializeCategorias(); // Categorias
        initializeProveedores(); // Proveedores
        initializeMateriasPrimas(); // Materias primas
        initializeProductos(); // Productos
    }

    private void initializePermisosAndUsuarios() {
        System.out.println("Verificando permisos...");

        List<Permiso> permisosToCreate = new ArrayList<>();

        Usuario kevin = Usuario.builder()
                .id(1041532485L)
                .nombre("Kevin")
                .apellido("Machado")
                .correo("kevin@example.com")
                .contraseña("1234")
                .telefono("3196382919")
                .direccion("Urrao")
                .foto("https://res.cloudinary.com/dtmtmn3cu/image/upload/v1754246870/Perfil_sa1uug.jpg")
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
                .foto("https://res.cloudinary.com/dtmtmn3cu/image/upload/v1754246870/Perfil_sa1uug.jpg")
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
                .foto("https://res.cloudinary.com/dtmtmn3cu/image/upload/v1754246870/Perfil_sa1uug.jpg")
                .permisos(new ArrayList<>())
                .build();

        crearYAsignarPermiso("HOME", List.of(samuel, kevin, johan), permisosToCreate);
        crearYAsignarPermiso("DASHBOARD", List.of(kevin, johan), permisosToCreate);
        crearYAsignarPermiso("PERSONAL", List.of(kevin, johan), permisosToCreate);
        crearYAsignarPermiso("INVENTARIOS", List.of(samuel, kevin, johan), permisosToCreate);
        crearYAsignarPermiso("REPORTES", List.of(samuel, kevin, johan), permisosToCreate);
        crearYAsignarPermiso("VENTAS", List.of(kevin, johan), permisosToCreate);
        crearYAsignarPermiso("CLIENTES", List.of(kevin, johan), permisosToCreate);
        crearYAsignarPermiso("PEDIDOS", List.of(samuel, kevin, johan), permisosToCreate);
        crearYAsignarPermiso("PROVEEDORES", List.of(kevin, johan), permisosToCreate);

        if (!permisosToCreate.isEmpty()) {
            permisoRepository.saveAll(permisosToCreate);
            System.out.println("Se crearon " + permisosToCreate.size() + " permisos nuevos");
        } else {
            System.out.println("Todos los permisos ya existen");
        }

        createUserIfNotExists(kevin.getId(), kevin.getCorreo(), kevin.getNombre(), kevin.getApellido(),
                kevin.getContraseña(), kevin.getDireccion(), kevin.getFoto(), kevin.getTelefono(), kevin.getPermisos());

        createUserIfNotExists(johan.getId(), johan.getCorreo(), johan.getNombre(), johan.getApellido(),
                johan.getContraseña(), johan.getDireccion(), johan.getFoto(), johan.getTelefono(), johan.getPermisos());

        createUserIfNotExists(samuel.getId(), samuel.getCorreo(), samuel.getNombre(), samuel.getApellido(),
                samuel.getContraseña(), samuel.getDireccion(), samuel.getFoto(), samuel.getTelefono(), samuel.getPermisos());
    }

    private void initializeProveedores() {

        Proveedor proveedorBuscado = proveedorService.buscarProveedorPorId(1L);

        if(proveedorBuscado != null) {
            System.out.println("Proveedor ya existente");
            return;
        }

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

    @Transactional
    private void initializeCategorias() {
        System.out.println("Verificando categorías...");
        List<Categoria> categorias = List.of(
                new Categoria(null, "Limpieza", new ArrayList<>()),
                new Categoria(null, "Higiene", new ArrayList<>())
        );

        for (Categoria categoria : categorias) {
            if (!categoriaRepository.existsByNombre(categoria.getNombre())) {
                System.out.println("Categoría " + categoria.getNombre() + " será creada");
                categoriaRepository.save(categoria);
            } else {
                System.out.println("Categoría " + categoria.getNombre() + " ya existe, omitiendo creación");
            }
        }

        System.out.println("Categorias agregadas: " + categoriaRepository.findAll());
    }

    @Transactional
    private void initializeMateriasPrimas() {
        if (materiaPrimaRepository.count() == 0) {
            List<MateriaPrima> materiasPrimas = List.of(
                    new MateriaPrima(null, "Ácido sulfónico", 3500, 4200, 50f),
                    new MateriaPrima(null, "Glicerina", 2500, 3000, 40f),
                    new MateriaPrima(null, "Carbonato de sodio", 1800, 2200, 60f),
                    new MateriaPrima(null, "Lauril éter sulfato de sodio", 4200, 4800, 30f),
                    new MateriaPrima(null, "Fragancia lavanda", 6000, 7000, 20f),
                    new MateriaPrima(null, "Colorante azul", 1000, 1200, 10f),
                    new MateriaPrima(null, "Formol", 1500, 1800, 15f),
                    new MateriaPrima(null, "Agua destilada", 300, 500, 100f),
                    new MateriaPrima(null, "Cloruro de amonio", 2000, 2500, 25f),
                    new MateriaPrima(null, "Alcohol etílico", 4500, 5200, 35f)
            );

            materiaPrimaRepository.saveAll(materiasPrimas);
            System.out.println("Materias primas base para productos de aseo creadas exitosamente");
        } else {
            System.out.println("Ya existen materias primas en la base de datos");
        }
    }

    @Transactional
    private void initializeProductos() {
        if (productoRepository.count() > 0) {
            System.out.println("Productos ya existen en la base de datos");
            return;
        }

        System.out.println("Buscando categoría con Nombre Limpieza...");
        Categoria categoria = categoriaRepository.findByNombre("Limpieza")
                .orElseThrow(() -> new RuntimeException("Categoría con ID 1 no existe"));

        System.out.println("Creando DTO del producto...");
        ProductoDTO dto = new ProductoDTO();
        dto.setNombre("Detergente en polvo");
        dto.setCosto(6000);
        dto.setPrecio(8500);
        dto.setStock(50);
        dto.setIva(true);

        CategoriaIdDTO catDto = new CategoriaIdDTO();
        catDto.setIdCategoria(categoria.getIdCategoria());
        dto.setIdCategoria(catDto);

        List<MateriaProductoDTO> materias = new ArrayList<>();
        materias.add(createMateriaDTO(1L, 15f)); // Ácido sulfónico
        materias.add(createMateriaDTO(3L, 10f)); // Carbonato de sodio
        dto.setMaterias(materias);

        System.out.println("Guardando producto usando ProductoService...");
        productoService.crearProductoDesdeDTO(dto);
        System.out.println("Producto con materias creado correctamente.");
    }

    private MateriaProductoDTO createMateriaDTO(Long idMateria, Float cantidad) {
        MateriaProductoDTO dto = new MateriaProductoDTO();
        dto.setIdMateria(idMateria);
        dto.setCantidad(cantidad);
        return dto;
    }

}