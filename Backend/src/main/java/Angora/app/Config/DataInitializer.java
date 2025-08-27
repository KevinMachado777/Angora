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

import java.time.LocalDateTime;
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
    private LoteRepository loteRepository;

    @Autowired
    private ProduccionRepository produccionRepository;

    @Autowired
    private ProduccionLoteRepository produccionLoteRepository;

    @Autowired
    private LoteUsadoRepository loteUsadoRepository;

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

    // guardamos el id del producto creado aquí si se crea en esta ejecución
    private String productoInicialId = null;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        initializePermisosAndUsuarios(); // Permisos y usuarios
        initializeCategorias(); // Categorias
        initializeProveedores(); // Proveedores
        initializeMateriasPrimas(); // Materias primas
        initializeProductos(); // Productos (podrá setear productoInicialId)
        initializeLotes(); // Lotes
        initializeProduccionesIniciales(); // Producciones (usa productoInicialId o fallback)
    }

    private void initializePermisosAndUsuarios() {
        System.out.println("Verificando permisos...");

        List<Permiso> permisosToCreate = new ArrayList<>();

        Usuario kevin = Usuario.builder()
                .id(1041532485L)
                .nombre("Kevin")
                .apellido("Machado")
                .correo("kevinandresmachadorueda@gmail.com")
                .contraseña("1234")
                .telefono("3196382919")
                .direccion("Urrao")
                .foto("https://res.cloudinary.com/dtmtmn3cu/image/upload/v1754451121/Perfil_xtqub7.jpg")
                .permisos(new ArrayList<>()) // <-- lista inicializada
                .build();

        Usuario johan = Usuario.builder()
                .id(1026134871L)
                .nombre("Johan")
                .apellido("Rios")
                .correo("johanestebanrios11@gmail.com")
                .contraseña("1234")
                .telefono("3002950000")
                .direccion("Versalles")
                .foto("https://res.cloudinary.com/dtmtmn3cu/image/upload/v1754451121/Perfil_xtqub7.jpg")
                .permisos(new ArrayList<>())
                .build();

        Usuario samuel = Usuario.builder()
                .id(1028140791L)
                .nombre("Samuel")
                .apellido("Ríos")
                .correo("samuelrios250307@gmail.com")
                .contraseña("1234")
                .telefono("3002955138")
                .direccion("Tamesis")
                .foto("https://res.cloudinary.com/dtmtmn3cu/image/upload/v1754451121/Perfil_xtqub7.jpg")
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
                    new MateriaPrima("MP1", "Ácido sulfónico", 3500, 4200, 50f),
                    new MateriaPrima("MP2", "Glicerina", 2500, 3000, 40f),
                    new MateriaPrima("MP3", "Carbonato de sodio", 1800, 2200, 60f),
                    new MateriaPrima("MP4", "Lauril éter sulfato de sodio", 4200, 4800, 30f),
                    new MateriaPrima("MP5", "Fragancia lavanda", 6000, 7000, 20f),
                    new MateriaPrima("MP6", "Colorante azul", 1000, 1200, 10f),
                    new MateriaPrima("MP7", "Formol", 1500, 1800, 15f),
                    new MateriaPrima("MP8", "Agua destilada", 300, 500, 100f),
                    new MateriaPrima("MP9", "Cloruro de amonio", 2000, 2500, 25f),
                    new MateriaPrima("MP10", "Alcohol etílico", 4500, 5200, 35f)
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
            System.out.println("Productos ya existen en la base de datos - no se crearán productos iniciales");
            return;
        }

        System.out.println("Buscando categoría con Nombre Limpieza...");
        Categoria categoria = categoriaRepository.findByNombre("Limpieza")
                .orElseThrow(() -> new RuntimeException("Categoría con Nombre 'Limpieza' no existe"));

        System.out.println("Creando DTO del producto...");
        ProductoDTO dto = new ProductoDTO();
        dto.setIdProducto("101");
        dto.setNombre("Detergente en polvo");
        dto.setCosto(6000);
        dto.setPrecioDetal(8500d);
        dto.setPrecioMayorista(8000d);
        dto.setStock(3);
        dto.setIva(true);

        CategoriaIdDTO catDto = new CategoriaIdDTO();
        catDto.setIdCategoria(categoria.getIdCategoria());
        dto.setIdCategoria(catDto);

        // Obtener IDs reales de materias por nombre (evita asumir 1L, 3L, etc.)
        List<MateriaProductoDTO> materias = new ArrayList<>();

        MateriaPrima mpAcido = materiaPrimaRepository.findByNombre("Ácido sulfónico")
                .orElseThrow(() -> new RuntimeException("Materia 'Ácido sulfónico' no encontrada"));
        MateriaPrima mpCarbonato = materiaPrimaRepository.findByNombre("Carbonato de sodio")
                .orElseThrow(() -> new RuntimeException("Materia 'Carbonato de sodio' no encontrada"));

        materias.add(createMateriaDTO(mpAcido.getIdMateria(), 15f)); // Ácido sulfónico
        materias.add(createMateriaDTO(mpCarbonato.getIdMateria(), 10f)); // Carbonato de sodio
        dto.setMaterias(materias);

        System.out.println("Guardando producto usando ProductoService...");
        // capturamos el DTO resultante (contendrá idProducto si todo fue bien)
        ProductoDTO creado = productoService.crearProductoDesdeDTO(dto);
        if (creado != null && creado.getIdProducto() != null) {
            productoInicialId = creado.getIdProducto();
            System.out.println("Producto inicial creado con id: " + productoInicialId);
        } else {
            System.out.println("Producto inicial creado pero no devolvió id (verificar).");
        }
    }

    @Transactional
    private void initializeLotes() {
        if (loteRepository.count() == 0) {
            System.out.println("Creando lotes predeterminados...");
            List<Lote> lotes = new ArrayList<>();

            // Lote para Ácido sulfónico (idMateria = MP1)
            lotes.add(new Lote("L1", "MP1", 3500, 50f, 50f, LocalDateTime.now(), 1L, null));

            // Lote para Glicerina (idMateria = MP2)
            lotes.add(new Lote("L2", "MP2", 2500, 40f, 40f, LocalDateTime.now(), 1L, null));

            // Lote para Carbonato de sodio (idMateria = MP3)
            lotes.add(new Lote("L3", "MP3", 1800, 60f, 60f, LocalDateTime.now(), 1L, null));

            // Lote para Lauril éter sulfato de sodio (idMateria = MP4)
            lotes.add(new Lote("L4", "MP4", 4200, 30f, 30f, LocalDateTime.now(), 1L, null));

            // Lote para Fragancia lavanda (idMateria = MP5)
            lotes.add(new Lote("L5", "MP5", 6000, 20f, 20f, LocalDateTime.now(), 1L, null));

            // Lote para Colorante azul (idMateria = MP6)
            lotes.add(new Lote("L6", "MP6", 1000, 10f, 10f, LocalDateTime.now(), 1L, null));

            // Lote para Formol (idMateria = MP7)
            lotes.add(new Lote("L7", "MP7", 1500, 15f, 15f, LocalDateTime.now(), 1L, null));

            // Lote para Agua destilada (idMateria = MP8)
            lotes.add(new Lote("L8", "MP8", 300, 100f, 100f, LocalDateTime.now(), 1L, null));

            // Lote para Cloruro de amonio (idMateria = MP9)
            lotes.add(new Lote("L9", "MP9", 2000, 25f, 25f, LocalDateTime.now(), 1L, null));

            // Lote para Alcohol etílico (idMateria = MP10)
            lotes.add(new Lote("L10", "MP10", 4500, 35f, 35f, LocalDateTime.now(), 1L, null));

            loteRepository.saveAll(lotes);
            System.out.println("Lotes predeterminados creados exitosamente");
        } else {
            System.out.println("Ya existen lotes en la base de datos");
        }
    }

    @Transactional
    private void initializeProduccionesIniciales() {
        System.out.println("Creando producciones iniciales para trazabilidad...");

        // Intento usar el id que guardamos si creamos producto en esta ejecución
        Producto producto = null;

        if (productoInicialId != null) {
            producto = productoRepository.findById(productoInicialId).orElse(null);
            System.out.println("Buscando producto por productoInicialId: " + productoInicialId + " -> " + (producto != null));
        }

        // si no encontramos por el id guardado, intentamos buscar por nombre (si existe)
        if (producto == null) {
            Optional<Producto> porNombre = productoRepository.findAll().stream()
                    .filter(p -> "Detergente en polvo".equalsIgnoreCase(p.getNombre()))
                    .findFirst();
            if (porNombre.isPresent()) {
                producto = porNombre.get();
                System.out.println("Encontrado producto por nombre: " + producto.getIdProducto());
            }
        }

        // fallback: si hay cualquier producto, usamos el último insertado
        if (producto == null && productoRepository.count() > 0) {
            producto = productoRepository.findTopByOrderByIdProductoDesc();
            System.out.println("Usando producto fallback (findTopByOrderByIdProductoDesc): " + (producto != null ? producto.getIdProducto() : "null"));
        }

        if (producto == null) {
            // No hay producto en la DB: no hacemos producciones iniciales, pero no tiramos excepción
            System.out.println("No se encontró ningún producto para crear producciones iniciales. Se omite esta parte.");
            return;
        }

        // Manejar stock null
        int cantidadProducida = producto.getStock() != null ? producto.getStock() : 0;

        // Crear una producción inicial para las unidades
        Produccion produccion = new Produccion(null, producto.getIdProducto(), LocalDateTime.now());
        produccion = produccionRepository.save(produccion);

        // Intentamos usar lotes L1 y L3 si existen; si no, buscamos dos lotes disponibles
        Lote lote1 = loteRepository.findById("L1").orElse(null);
        Lote lote3 = loteRepository.findById("L3").orElse(null);

        // si faltan, intentamos buscar los dos primeros lotes que existan
        if (lote1 == null || lote3 == null) {
            List<Lote> primeros = loteRepository.findAll();
            if (primeros.size() >= 2) {
                lote1 = primeros.get(0);
                lote3 = primeros.get(1);
            } else if (primeros.size() == 1) {
                lote1 = primeros.get(0);
                lote3 = primeros.get(0);
            } else {
                System.out.println("No hay lotes suficientes para crear producciones iniciales. Se omite.");
                return;
            }
        }

        // Crear ProduccionLote para lote1 y lote3
        ProduccionLote pl1 = new ProduccionLote(
                null,
                produccion.getIdProduccion(),
                lote1.getIdLote(),
                15f * cantidadProducida
        );
        produccionLoteRepository.save(pl1);

        ProduccionLote pl3 = new ProduccionLote(
                null,
                produccion.getIdProduccion(),
                lote3.getIdLote(),
                10f * cantidadProducida
        );
        produccionLoteRepository.save(pl3);

        // Creamos LoteUsado **usando setters** para no depender de una firma de constructor específica
        LoteUsado lu1 = new LoteUsado();
        lu1.setIdLote(lote1.getIdLote());
        lu1.setIdProducto(producto.getIdProducto());
        lu1.setCantidadUsada(15f * cantidadProducida);
        lu1.setFechaProduccion(LocalDateTime.now());
        lu1.setIdProduccion(produccion.getIdProduccion());
        loteUsadoRepository.save(lu1);

        LoteUsado lu3 = new LoteUsado();
        lu3.setIdLote(lote3.getIdLote());
        lu3.setIdProducto(producto.getIdProducto());
        lu3.setCantidadUsada(10f * cantidadProducida);
        lu3.setFechaProduccion(LocalDateTime.now());
        lu3.setIdProduccion(produccion.getIdProduccion());
        loteUsadoRepository.save(lu3);

        // Actualizar cantidades disponibles en lotes (protegiendo contra nulls)
        if (lote1.getCantidadDisponible() != null) {
            lote1.setCantidadDisponible(lote1.getCantidadDisponible() - 15f * cantidadProducida);
            loteRepository.save(lote1);
        }
        if (lote3.getCantidadDisponible() != null) {
            lote3.setCantidadDisponible(lote3.getCantidadDisponible() - 10f * cantidadProducida);
            loteRepository.save(lote3);
        }

        // Actualizar stock de materia prima si existen
        if (lote1.getIdMateria() != null) {
            MateriaPrima mp1 = materiaPrimaRepository.findById(lote1.getIdMateria())
                    .orElse(null);
            if (mp1 != null) {
                mp1.setCantidad(lote1.getCantidadDisponible());
                materiaPrimaRepository.save(mp1);
            }
        }
        if (lote3.getIdMateria() != null) {
            MateriaPrima mp3 = materiaPrimaRepository.findById(lote3.getIdMateria())
                    .orElse(null);
            if (mp3 != null) {
                mp3.setCantidad(lote3.getCantidadDisponible());
                materiaPrimaRepository.save(mp3);
            }
        }

        System.out.println("Producciones iniciales creadas para el producto id: " + producto.getIdProducto());
    }

    private MateriaProductoDTO createMateriaDTO(String idMateria, Float cantidad) { // Modificado: Long a String
        MateriaProductoDTO dto = new MateriaProductoDTO();
        dto.setIdMateria(idMateria);
        dto.setCantidad(cantidad);
        return dto;
    }
}