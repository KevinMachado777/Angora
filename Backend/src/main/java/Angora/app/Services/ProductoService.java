package Angora.app.Services;

import Angora.app.Controllers.dto.CategoriaIdDTO;
import Angora.app.Controllers.dto.MateriaProductoDTO;
import Angora.app.Controllers.dto.ProductoDTO;
import Angora.app.Entities.*;
import Angora.app.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

    @Autowired
    private MovimientoRepository movimientoRepository;

    @Autowired
    private MovimientoInventarioService movimientoInventarioService;

    // Buscar todos los productos
    public List<ProductoDTO> findAll() {
        var productos = productoRepository.findAll();
        List<ProductoDTO> productosDtos = new ArrayList<>();
        productos.forEach(producto -> {
            ProductoDTO product = new ProductoDTO();
            product.setIdProducto(producto.getIdProducto());
            product.setNombre(producto.getNombre());
            product.setPrecio(producto.getPrecio());
            product.setCosto(producto.getCosto());
            product.setStock(producto.getStock());
            product.setIva(producto.getIva());
            product.setPorcentajeGanancia(producto.getPorcentajeGanancia() != null ? producto.getPorcentajeGanancia() : 15); // NUEVO

            // Manejar categoria nullable
            if (producto.getIdCategoria() != null) {
                CategoriaIdDTO categoriaIdDto = new CategoriaIdDTO();
                categoriaIdDto.setIdCategoria(producto.getIdCategoria().getIdCategoria());
                product.setIdCategoria(categoriaIdDto);
            } else {
                product.setIdCategoria(null);
            }

            // Materias (si las hay)
            List<MateriaProductoDTO> materias = producto.getMaterias() == null
                    ? new ArrayList<>()
                    : producto.getMaterias().stream().map(dto -> {
                MateriaProductoDTO mp = new MateriaProductoDTO();
                mp.setIdMateria(dto.getIdMateria());
                mp.setCantidad(dto.getCantidad());
                return mp;
            }).collect(Collectors.toList());
            product.setMaterias(materias);

            productosDtos.add(product);
        });
        return productosDtos;
    }

    // Buscar un producto por su ID
    public ProductoDTO findById(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        ProductoDTO productoDto = new ProductoDTO();
        productoDto.setIdProducto(producto.getIdProducto());
        productoDto.setNombre(producto.getNombre());
        productoDto.setPrecio(producto.getPrecio());
        productoDto.setCosto(producto.getCosto());
        productoDto.setStock(producto.getStock());
        productoDto.setIva(producto.getIva());
        productoDto.setPorcentajeGanancia(producto.getPorcentajeGanancia() != null ? producto.getPorcentajeGanancia() : 15); // NUEVO

        if (producto.getIdCategoria() != null) {
            CategoriaIdDTO categoriaIdDto = new CategoriaIdDTO();
            categoriaIdDto.setIdCategoria(producto.getIdCategoria().getIdCategoria());
            productoDto.setIdCategoria(categoriaIdDto);
        } else {
            productoDto.setIdCategoria(null);
        }

        List<MateriaProductoDTO> materias = producto.getMaterias() == null
                ? new ArrayList<>()
                : producto.getMaterias().stream().map(dto -> {
            MateriaProductoDTO mp = new MateriaProductoDTO();
            mp.setIdMateria(dto.getIdMateria());
            mp.setCantidad(dto.getCantidad());
            return mp;
        }).collect(Collectors.toList());
        productoDto.setMaterias(materias);

        return productoDto;
    }

    // Metodo para listar productos
    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    // Crear un producto recibiendo los datos en dto (sin cambios)
    @Transactional
    public ProductoDTO crearProductoDesdeDTO(ProductoDTO productoDTO) {
        Categoria categoria = null;
        if (productoDTO.getIdCategoria() != null) {
            // buscar la categoria si el DTO la trae
            categoria = categoriaRepository.findById(productoDTO.getIdCategoria().getIdCategoria())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + productoDTO.getIdCategoria().getIdCategoria()));
        }

        // Asegurar que porcentajeGanancia tenga un valor mínimo de 15
        Integer porcentaje = productoDTO.getPorcentajeGanancia() != null ? productoDTO.getPorcentajeGanancia() : 15;
        if (porcentaje < 15) porcentaje = 15;

        Producto producto = Producto.builder()
                .nombre(productoDTO.getNombre())
                .precio(productoDTO.getPrecio())
                .costo(productoDTO.getCosto())
                .stock(productoDTO.getStock() != null ? productoDTO.getStock() : 0)
                .iva(productoDTO.getIva())
                .porcentajeGanancia(porcentaje)
                .idCategoria(categoria)
                .build();
        producto = productoRepository.save(producto);
        Producto finalProducto = producto;
        List<MateriaProducto> materias = productoDTO.getMaterias().stream().map(dto -> {
            if (!materiaRepository.existsById(dto.getIdMateria())) {
                throw new RuntimeException("Materia con ID " + dto.getIdMateria() + " no encontrada");
            }
            MateriaProducto mp = new MateriaProducto();
            mp.setIdMateria(dto.getIdMateria());
            mp.setCantidad(dto.getCantidad());
            mp.setProducto(finalProducto);
            return mp;
        }).collect(Collectors.toList());
        producto.setMaterias(materias);
        productoRepository.save(producto);
        Producto ultimoProducto = productoRepository.findTopByOrderByIdProductoDesc();
        productoDTO.setIdProducto(ultimoProducto.getIdProducto());

        return productoDTO;
    }

    @Transactional
    public ProductoDTO actualizarProductoDesdeDTO(ProductoDTO productoDTO) {
        Producto producto = productoRepository.findById(productoDTO.getIdProducto())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Actualizar campos simples
        producto.setNombre(productoDTO.getNombre());
        producto.setPrecio(productoDTO.getPrecio());
        producto.setCosto(productoDTO.getCosto());
        producto.setStock(productoDTO.getStock());
        producto.setIva(productoDTO.getIva());

        // Actualizar porcentajeGanancia
        Integer porcentaje = productoDTO.getPorcentajeGanancia() != null ? productoDTO.getPorcentajeGanancia() : 15;
        if (porcentaje < 15) porcentaje = 15;
        producto.setPorcentajeGanancia(porcentaje);

        // Manejar categoría (puede ser null)
        if (productoDTO.getIdCategoria() != null && productoDTO.getIdCategoria().getIdCategoria() != null) {
            Categoria categoria = categoriaRepository.findById(productoDTO.getIdCategoria().getIdCategoria())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + productoDTO.getIdCategoria().getIdCategoria()));
            producto.setIdCategoria(categoria);
        } else {
            producto.setIdCategoria(null);
        }

        // Asegurarse de que la colección exista
        if (producto.getMaterias() == null) {
            producto.setMaterias(new ArrayList<>());
        }

        // Limpiar la colección gestionada y volver a poblarla
        producto.getMaterias().clear();

        List<MateriaProducto> nuevasMaterias = new ArrayList<>();
        if (productoDTO.getMaterias() != null) {
            for (var dto : productoDTO.getMaterias()) {
                if (!materiaRepository.existsById(dto.getIdMateria())) {
                    throw new RuntimeException("Materia con ID " + dto.getIdMateria() + " no encontrada");
                }
                MateriaProducto mp = new MateriaProducto();
                mp.setIdMateria(dto.getIdMateria());
                mp.setCantidad(dto.getCantidad());
                mp.setProducto(producto); // referencia al entity gestionado
                nuevasMaterias.add(mp);
            }
        }

        producto.getMaterias().addAll(nuevasMaterias);
        productoRepository.save(producto);
        return productoDTO;
    }

    // Metodo para guardar un producto
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

    // Metodo específico para disminuir stock por pérdida
    @Transactional
    public Producto disminuirStockPorPerdida(Long idProducto, int cantidadADisminuir) {
        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + idProducto));

        int stockActual = producto.getStock() != null ? producto.getStock() : 0;

        if (cantidadADisminuir <= 0) {
            throw new RuntimeException("La cantidad a disminuir debe ser mayor que 0");
        }

        if (cantidadADisminuir > stockActual) {
            throw new RuntimeException("No se puede disminuir más stock del disponible");
        }

        int nuevoStock = stockActual - cantidadADisminuir;
        LocalDateTime fechaActual = LocalDateTime.now();

        // Registrar movimiento de pérdida/salida
        Movimiento movimiento = new Movimiento();
        movimiento.setProducto(producto);
        movimiento.setCantidadAnterior((float) stockActual);
        movimiento.setCantidadCambio((float) cantidadADisminuir);
        movimiento.setCantidadActual((float) nuevoStock);
        movimiento.setTipoMovimiento("salida"); // salida por pérdida
        movimiento.setFechaMovimiento(fechaActual);
        movimientoRepository.save(movimiento);

        // Actualizar stock del producto
        producto.setStock(nuevoStock);
        productoRepository.save(producto);

        return producto;
    }

    // Actualizar stock
    @Transactional
    public Producto updateStock(Long idProducto, int nuevaCantidad) {
        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + idProducto));

        int stockActual = producto.getStock() != null ? producto.getStock() : 0;
        int diferencia = nuevaCantidad - stockActual;
        LocalDateTime fechaActual = LocalDateTime.now();

        // Si hay cambio, registrar movimiento de producto (entrada/ salida) Y set cantidadActual
        if (diferencia != 0) {
            Movimiento movimiento = new Movimiento();
            movimiento.setProducto(producto);
            movimiento.setCantidadAnterior((float) stockActual);
            movimiento.setCantidadCambio((float) Math.abs(diferencia));
            movimiento.setCantidadActual((float) nuevaCantidad);
            movimiento.setTipoMovimiento(diferencia > 0 ? "entrada" : "salida");
            movimiento.setFechaMovimiento(fechaActual);
            movimientoRepository.save(movimiento);
        }

        if (diferencia > 0) {
            // Aumentar stock (fabricación)
            Produccion produccion = new Produccion();
            produccion.setIdProducto(idProducto);
            produccion.setFecha(fechaActual);
            Produccion savedProduccion = produccionRepository.save(produccion);
            Long idProduccion = savedProduccion.getIdProduccion();

            // Antes de consumir lotes: guardar snapshot de cantidades de cada materia implicada
            // Para cada materia del producto: consumir lotes (FIFO) y después generar movimiento de materia
            for (MateriaProducto mp : producto.getMaterias()) {
                String idMateriaAumentar = mp.getIdMateria(); // Usar nombre único para evitar conflicto
                MateriaPrima materia = materiaRepository.findById(idMateriaAumentar)
                        .orElseThrow(() -> new RuntimeException("Materia prima no encontrada: " + idMateriaAumentar));
                Float anteriorMateria = materia.getCantidad() != null ? materia.getCantidad() : 0f;

                float cantidadNecesaria = mp.getCantidad() * diferencia;
                if (!hasSufficientStock(idMateriaAumentar, cantidadNecesaria)) {
                    throw new RuntimeException("Stock insuficiente para la materia prima " + idMateriaAumentar);
                }

                List<Lote> lotes = loteRepository.findByIdMateriaAndCantidadDisponibleGreaterThan(idMateriaAumentar, 0f);
                float restante = cantidadNecesaria;

                for (Lote lote : lotes) {
                    if (restante <= 0) break;
                    float usar = Math.min(lote.getCantidadDisponible(), restante);
                    lote.setCantidadDisponible(lote.getCantidadDisponible() - usar);
                    loteRepository.save(lote);

                    // traza
                    produccionLoteRepository.save(new ProduccionLote(idProduccion, lote.getIdLote(), usar));

                    // LoteUsado con idProduccion
                    LoteUsado loteUsado = new LoteUsado(null, lote.getIdLote(), idProducto, usar, fechaActual, idProduccion);
                    loteUsadoRepository.save(loteUsado);

                    restante -= usar;
                }

                // después de consumir lotes, recalcular cantidad disponible actual de la materia
                Float actualMateria = loteRepository.sumCantidadDisponibleByIdMateria(idMateriaAumentar);
                if (actualMateria == null) actualMateria = 0f;

                // actualizar entidad materia en BD
                materia.setCantidad(actualMateria);
                materiaRepository.save(materia);

                // registrar movimiento de materia (salida por uso en producción)
                movimientoInventarioService.crearMovimientoMateria(materia, anteriorMateria, actualMateria, "salida");
            }

        } else if (diferencia < 0) {
            // Reducir stock (devolución)
            int cantidadDevolver = Math.abs(diferencia);
            Produccion ultimaProduccion = produccionRepository.findTopByIdProductoOrderByFechaDesc(idProducto)
                    .orElseThrow(() -> new RuntimeException("No hay producciones para devolver stock"));
            Long idProduccion = ultimaProduccion.getIdProduccion();

            for (MateriaProducto mp : producto.getMaterias()) {
                String idMateriaDevolver = mp.getIdMateria();
                float cantidadPorDevolver = mp.getCantidad() * cantidadDevolver;
                List<Lote> lotes = loteRepository.findByIdMateriaAndCantidadDisponibleGreaterThan(idMateriaDevolver, 0f);
                float restante = cantidadPorDevolver;

                for (Lote lote : lotes) {
                    if (restante <= 0) break;
                    List<ProduccionLote> prodLotes = produccionLoteRepository.findByIdProduccionAndIdLote(idProduccion, lote.getIdLote());
                    if (!prodLotes.isEmpty()) {
                        ProduccionLote prodLote = prodLotes.get(0);
                        float devolver = Math.min(restante, prodLote.getCantidadUsadaDelLote());
                        lote.setCantidadDisponible(lote.getCantidadDisponible() + devolver);
                        prodLote.setCantidadUsadaDelLote(prodLote.getCantidadUsadaDelLote() - devolver);
                        if (prodLote.getCantidadUsadaDelLote() > 0) {
                            produccionLoteRepository.save(prodLote);
                        }
                        loteRepository.save(lote);
                        restante -= devolver;
                    }
                }

                // después de devolver lotes, recalcular materia y registrar movimiento de materia (entrada)
                MateriaPrima materia = materiaRepository.findById(idMateriaDevolver)
                        .orElseThrow(() -> new RuntimeException("Materia prima no encontrada: " + idMateriaDevolver));
                Float anteriorMateria = materia.getCantidad() != null ? materia.getCantidad() : 0f;
                Float actualMateria = loteRepository.sumCantidadDisponibleByIdMateria(idMateriaDevolver);
                if (actualMateria == null) actualMateria = 0f;
                materia.setCantidad(actualMateria);
                materiaRepository.save(materia);

                movimientoInventarioService.crearMovimientoMateria(materia, anteriorMateria, actualMateria, "entrada");
            }
        }

        producto.setStock(nuevaCantidad);
        productoRepository.save(producto);

        // Actualiza cantidades de materias relacionadas
        updateMateriaCantidadForAll(producto.getMaterias().stream().map(MateriaProducto::getIdMateria).collect(Collectors.toSet()));

        return producto;
    }

    @Transactional
    private void updateMateriaCantidadForAll(Set<String> idMaterias) {
        for (String idMateria : idMaterias) {
            Float total = loteRepository.sumCantidadDisponibleByIdMateria(idMateria);
            MateriaPrima materia = materiaRepository.findById(idMateria)
                    .orElseThrow(() -> new RuntimeException("Materia no encontrada: " + idMateria));
            materia.setCantidad(total != null ? total : 0f);
            materiaRepository.save(materia);
        }
    }

    private boolean hasSufficientStock(String idMateria, float cantidadNecesaria) {
        Float totalDisponible = loteRepository.sumCantidadDisponibleByIdMateria(idMateria);
        return totalDisponible != null && totalDisponible >= cantidadNecesaria;
    }

    // Metodo que elimina un producto
    @Transactional
    public void delete(Long id) {
        materiaProductoRepository.deleteByProducto_IdProducto(id);
        productoRepository.deleteById(id);
    }

    // Ajustado para usar updateStock
    public void disminuirStock(Producto producto, int cantidadComprada) {
        updateStock(producto.getIdProducto(), producto.getStock() - cantidadComprada);
    }

    // Metodo que Recalcula costo y precio de todos los productos que usan la materia
    @Transactional
    public void recalculateProductsCostByMateria(MateriaPrima materia) {
        // Costo unitario de la materia actualizada
        double costoUnitarioMateria = materia.getCosto() != null ? materia.getCosto().doubleValue() : 0.0;

        // Obtener todas las relaciones materia-producto que usan esta materia
        List<MateriaProducto> relaciones = materiaProductoRepository.findByIdMateria(materia.getIdMateria());

        // Un producto sólo tiene una entrada por materia, así que iteramos relaciones
        for (MateriaProducto rel : relaciones) {
            // Asegurar tener el producto cargado
            Producto producto = rel.getProducto() != null && rel.getProducto().getIdProducto() != null
                    ? productoRepository.findById(rel.getProducto().getIdProducto()).orElse(null)
                    : null;
            if (producto == null) {
                continue;
            }

            // Recalcular costo del producto sumando por cada materia del producto
            double nuevoCostoRaw = 0.0;
            List<MateriaProducto> materiasDelProducto = producto.getMaterias() != null ? producto.getMaterias() : new ArrayList<>();
            for (MateriaProducto mp : materiasDelProducto) {
                String idM = mp.getIdMateria();
                double costoM = 0.0;
                MateriaPrima mpEntidad = materiaRepository.findById(idM).orElse(null);
                if (mpEntidad != null && mpEntidad.getCosto() != null) {
                    costoM = mpEntidad.getCosto().doubleValue();
                }
                double cantidad = mp.getCantidad() != null ? mp.getCantidad() : 0.0;
                nuevoCostoRaw += costoM * cantidad;
            }

            int nuevoCostoRedondeado = roundTo50(nuevoCostoRaw);

            // Calcular nuevo precio preservando markup histórico
            double oldCosto = producto.getCosto() != null ? producto.getCosto() : 0.0;
            double oldPrecio = producto.getPrecio() != null ? producto.getPrecio() : 0.0;
            double nuevoPrecioCalc;
            if (oldCosto > 0.0) {
                double markup = oldPrecio / oldCosto;
                nuevoPrecioCalc = nuevoCostoRedondeado * markup;
            } else {
                nuevoPrecioCalc = nuevoCostoRedondeado * 1.15; // 15% por defecto
            }
            int nuevoPrecioRedondeado = roundTo50(nuevoPrecioCalc);

            // Persistir sólo si hay cambio
            boolean changed = false;
            if (producto.getCosto() == null || producto.getCosto().intValue() != nuevoCostoRedondeado) {
                producto.setCosto(nuevoCostoRedondeado);
                changed = true;
            }
            if (producto.getPrecio() == null || producto.getPrecio().intValue() != nuevoPrecioRedondeado) {
                producto.setPrecio(nuevoPrecioRedondeado);
                changed = true;
            }

            if (changed) {
                productoRepository.save(producto);
            }
        }
    }

    private int roundTo50(double value) {
        return (int) (Math.round(value / 50.0) * 50);
    }
}