package Angora.app.Services;

import Angora.app.Controllers.dto.CategoriaIdDTO;
import Angora.app.Controllers.dto.MateriaProductoDTO;
import Angora.app.Controllers.dto.ProductoDTO;
import Angora.app.Entities.*;
import Angora.app.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// Servicio para el inventario de productos
@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private MateriaProductoRepository materiaProductoRepository;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private LoteUsadoRepository loteUsadoRepository;

    @Autowired
    private ProduccionRepository produccionRepository;

    @Autowired
    private ProduccionLoteRepository produccionLoteRepository;

    @Autowired
    private MateriaPrimaRepository materiaRepository;

    // Buscar todos los productos
    public List<ProductoDTO> findAll() {

        var productos = productoRepository.findAll();

        List<ProductoDTO> productosDtos = new ArrayList<>();

        productos.forEach(producto -> {

            CategoriaIdDTO categoriaIdDto = new CategoriaIdDTO();
            categoriaIdDto.setIdCategoria(producto.getIdCategoria().getIdCategoria());

            List<MateriaProductoDTO> materias = producto.getMaterias().stream().map(dto -> {

                // Creamos la relación producto-materia
                MateriaProductoDTO mp = new MateriaProductoDTO();
                mp.setIdMateria(dto.getIdMateria());
                mp.setCantidad(dto.getCantidad());

                return mp;
            }).collect(Collectors.toList());

            ProductoDTO product = new ProductoDTO();

            product.setIdProducto(producto.getIdProducto());
            product.setNombre(producto.getNombre());
            product.setPrecio(producto.getPrecio());
            product.setCosto(producto.getCosto());
            product.setStock(producto.getStock());
            product.setIva(producto.getIva());
            product.setIdCategoria(categoriaIdDto);
            product.setMaterias(materias);

            productosDtos.add(product);
        });

        return productosDtos;
    }

    // Buscar un producto por su ID
    public ProductoDTO findById(Long id) {

        // Buscamos el producto
        Producto producto = productoRepository.findById(id).orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Obtenemos la categoria y guardamos en dto de categoria
        CategoriaIdDTO categoriaIdDto = new CategoriaIdDTO();
        categoriaIdDto.setIdCategoria(producto.getIdCategoria().getIdCategoria());

        // Obtenemos las materias
        List<MateriaProductoDTO> materias = producto.getMaterias().stream().map(dto -> {

            // Creamos la relación producto-materia
            MateriaProductoDTO mp = new MateriaProductoDTO();
            mp.setIdMateria(dto.getIdMateria());
            mp.setCantidad(dto.getCantidad());

            return mp;
        }).collect(Collectors.toList());

        ProductoDTO productoDto = new ProductoDTO();
        productoDto.setIdProducto(producto.getIdProducto());
        productoDto.setNombre(producto.getNombre());
        productoDto.setPrecio(producto.getPrecio());
        productoDto.setCosto(producto.getCosto());
        productoDto.setStock(producto.getStock());
        productoDto.setIva(producto.getIva());
        productoDto.setIdCategoria(categoriaIdDto);
        productoDto.setMaterias(materias);


        return productoDto;
    }

    // Crear un producto recibiendo los datos en dto,
    // Luego se construye el objeto de Producto y se guarda en la base de datos
    @Transactional
    public ProductoDTO crearProductoDesdeDTO(ProductoDTO productoDTO) {
        // Buscar la categoría por ID (lanzar error si no existe)
        Categoria categoria = categoriaRepository.findById(productoDTO.getIdCategoria().getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: "
                        + productoDTO.getIdCategoria().getIdCategoria()));

        // Crear y guardar el producto base (sin materias aún)
        Producto producto = Producto.builder()
                .nombre(productoDTO.getNombre())
                .precio(productoDTO.getPrecio())
                .costo(productoDTO.getCosto())
                .stock(productoDTO.getStock())
                .iva(productoDTO.getIva())
                .idCategoria(categoria)
                .build();

        // Guardamos el producto para generar su ID
        producto = productoRepository.save(producto);

        // Validamos y convertimos cada DTO de materia a entidad MateriaProducto
        Producto finalProducto = producto;
        List<MateriaProducto> materias = productoDTO.getMaterias().stream().map(dto -> {
            if (!materiaRepository.existsById(dto.getIdMateria())) {
                throw new RuntimeException("Materia con ID " + dto.getIdMateria() + " no encontrada");
            }

            // Creamos la relación producto-materia
            MateriaProducto mp = new MateriaProducto();
            mp.setIdMateria(dto.getIdMateria());
            mp.setCantidad(dto.getCantidad());
            mp.setProducto(finalProducto);  // Relación inversa

            return mp;
        }).collect(Collectors.toList());

        // Establecemos las materias y actualizamos el producto
        producto.setMaterias(materias);

        // Guardamos el producto final con las relaciones
        productoRepository.save(producto);

        return productoDTO;
    }

    // Actualizar un producto
    @Transactional
    public ProductoDTO actualizarProductoDesdeDTO(ProductoDTO productoDTO) {
        Producto productoBuscado = productoRepository.findById(productoDTO.getIdProducto())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Buscar la categoría por ID (lanzar error si no existe)
        Categoria categoria = categoriaRepository.findById(productoDTO.getIdCategoria().getIdCategoria())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: "
                        + productoDTO.getIdCategoria().getIdCategoria()));

        Producto producto = Producto.builder()
                .idProducto(productoBuscado.getIdProducto())
                .nombre(productoDTO.getNombre())
                .precio(productoDTO.getPrecio())
                .costo(productoDTO.getCosto())
                .stock(productoDTO.getStock())
                .iva(productoDTO.getIva())
                .idCategoria(categoria)
                .build();

        // Validamos y convertimos cada DTO de materia a entidad MateriaProducto
        Producto finalProducto = producto;
        List<MateriaProducto> materias = productoDTO.getMaterias().stream().map(dto -> {
            if (!materiaRepository.existsById(dto.getIdMateria())) {
                throw new RuntimeException("Materia con ID " + dto.getIdMateria() + " no encontrada");
            }

            // Creamos la relación producto-materia
            MateriaProducto mp = new MateriaProducto();
            mp.setIdMateria(dto.getIdMateria());
            mp.setCantidad(dto.getCantidad());
            mp.setProducto(finalProducto);  // Relación inversa

            return mp;
        }).collect(Collectors.toList());

        // Establecemos las materias y actualizamos el producto
        producto.setMaterias(materias);

        // Guardamos el producto final con las relaciones
        productoRepository.save(producto);

        return productoDTO;
    }

    // Método par guardar un producto
    @Transactional
    public Producto save(Producto producto) {
        if (producto.getIdCategoria() != null && !categoriaRepository.existsById(producto.getIdCategoria().getIdCategoria())) {
            throw new RuntimeException("Categoría no encontrada");
        }
        if (producto.getMaterias() != null) {
            for (MateriaProducto mp : producto.getMaterias()) {
                if (!materiaRepository.existsById(mp.getIdMateria())) {
                    throw new RuntimeException("Materia con ID " + mp.getIdMateria() + " no encontrada");
                }
            }
        }
        return productoRepository.save(producto);

    }

    // Falta cuadrarlo
    /*@Transactional
    public Producto updateStock(Long idProducto, int nuevaCantidad){
        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        float diferencia = nuevaCantidad - producto.getStock();

        if (diferencia > 0) {
            // Aumentar stock
            Produccion produccion = new Produccion();
            produccion.setIdProducto(idProducto);
            produccion.setFecha(LocalDateTime.now());
            Produccion savedProduccion = produccionRepository.save(produccion);

            for (MateriaProducto mp : producto.getMaterias()) {
                int cantidadNecesaria = (int) (mp.getCantidad() * diferencia);
                List<Lote> lotes = loteRepository.findAll().stream()
                        .filter(l -> l.getIdMateria().equals(mp.getIdMateria()) && l.getCantidadDisponible() > 0)
                        .sorted((a, b) -> a.getFechaIngreso().compareTo(b.getFechaIngreso()))
                        .toList();

                for (Lote lote : lotes) {
                    if (cantidadNecesaria <= 0) break;
                    float cantidadUsada = Math.min(lote.getCantidadDisponible(), cantidadNecesaria);
                    lote.setCantidadDisponible(lote.getCantidadDisponible() - cantidadUsada);
                    cantidadNecesaria -= cantidadUsada;

                    LoteUsado loteUsado = new LoteUsado();
                    loteUsado.setIdLote(lote.getIdLote());
                    loteUsado.setIdProducto(idProducto);
                    loteUsado.setCantidadUsada(cantidadUsada);
                    loteUsado.setFechaProduccion(LocalDateTime.now());
                    loteUsadoRepository.save(loteUsado);

                    ProduccionLote produccionLote = new ProduccionLote();
                    produccionLote.setIdProduccion(savedProduccion.getIdProduccion());
                    produccionLote.setIdLote(lote.getIdLote());
                    produccionLote.setCantidadUsadaDelLote(cantidadUsada);
                    produccionLoteRepository.save(produccionLote);

                    loteRepository.save(lote);

                    MateriaPrima materia = materiaRepository.findById(lote.getIdMateria())
                            .orElseThrow(() -> new RuntimeException("Materia prima no encontrada"));
                    int totalDisponible = loteRepository.findAll().stream()
                            .filter(l -> l.getIdMateria().equals(lote.getIdMateria()))
                            .mapToInt(Lote::getCantidadDisponible)
                            .sum();
                    materia.setCantidad(totalDisponible);
                    materiaRepository.save(materia);
                }

                if (cantidadNecesaria > 0) {
                    throw new RuntimeException("No hay suficiente stock de materia prima con ID " + mp.getIdMateria());
                }
            }
        } else if (diferencia < 0) {
            // Reducir stock
            int cantidadDevolver = (int) Math.abs(diferencia);
            Produccion ultimaProduccion = produccionRepository.findAll().stream()
                    .filter(p -> p.getIdProducto().equals(idProducto))
                    .max((a, b) -> b.getFecha().compareTo(a.getFecha()))
                    .orElse(null);

            if (ultimaProduccion != null) {
                Long idProduccion = ultimaProduccion.getIdProduccion();
                for (MateriaProducto mp : producto.getMaterias()) {
                    int cantidadDevolverMat = mp.getCantidad() * cantidadDevolver;
                    List<Lote> lotes = loteRepository.findAll().stream()
                            .filter(l -> l.getIdMateria().equals(mp.getIdMateria()))
                            .sorted((a, b) -> b.getFechaIngreso().compareTo(a.getFechaIngreso()))
                            .toList();

                    for (Lote lote : lotes) {
                        if (cantidadDevolverMat <= 0) break;
                        int cantidadDevolverLote = Math.min(cantidadDevolverMat, mp.getCantidad() * cantidadDevolver);
                        lote.setCantidadDisponible(lote.getCantidadDisponible() + cantidadDevolverLote);
                        cantidadDevolverMat -= cantidadDevolverLote;

                        LoteUsado loteUsado = loteUsadoRepository.findAll().stream()
                                .filter(lu -> lu.getIdLote().equals(lote.getIdLote()) &&
                                        lu.getIdProducto().equals(idProducto) &&
                                        lu.getFechaProduccion().equals(ultimaProduccion.getFecha()))
                                .findFirst().orElse(null);

                        if (loteUsado != null) {
                            if (loteUsado.getCantidadUsada() <= cantidadDevolverLote) {
                                loteUsadoRepository.delete(loteUsado);
                                ProduccionLote prodLote = produccionLoteRepository.findAll().stream()
                                        .filter(pl -> pl.getIdProduccion().equals(idProduccion) &&
                                                pl.getIdLote().equals(lote.getIdLote()))
                                        .findFirst().orElse(null);
                                if (prodLote != null) {
                                    produccionLoteRepository.delete(prodLote);
                                }
                            } else {
                                loteUsado.setCantidadUsada(loteUsado.getCantidadUsada() - cantidadDevolverLote);
                                loteUsadoRepository.save(loteUsado);
                                ProduccionLote prodLote = produccionLoteRepository.findAll().stream()
                                        .filter(pl -> pl.getIdProduccion().equals(idProduccion) &&
                                                pl.getIdLote().equals(lote.getIdLote()))
                                        .findFirst().orElse(null);
                                if (prodLote != null) {
                                    prodLote.setCantidadUsadaDelLote(prodLote.getCantidadUsadaDelLote() - cantidadDevolverLote);
                                    produccionLoteRepository.save(prodLote);
                                }
                            }
                        }
                        loteRepository.save(lote);
                    }

                    Materia materia = materiaRepository.findById(mp.getIdMateria())
                            .orElseThrow(() -> new RuntimeException("Materia no encontrada"));
                    int totalDisponible = loteRepository.findAll().stream()
                            .filter(l -> l.getIdMateria().equals(mp.getIdMateria()))
                            .mapToInt(Lote::getCantidadDisponible)
                            .sum();
                    materia.setCantidad(totalDisponible);
                    materiaRepository.save(materia);
                }

                if (produccionLoteRepository.findAll().stream()
                        .noneMatch(pl -> pl.getIdProduccion().equals(idProduccion))) {
                    produccionRepository.deleteById(idProduccion);
                }
            }
        }

        producto.setStock(nuevaCantidad);
        return productoRepository.save(producto);
    }*/

    // Método que elimina un producto
    @Transactional
    public void delete(Long id){
        materiaProductoRepository.deleteByProducto_IdProducto(id);
        productoRepository.deleteById(id);
    }
}
