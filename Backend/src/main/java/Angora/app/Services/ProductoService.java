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
            product.setPrecioDetal(producto.getPrecioDetal());
            product.setPrecioMayorista(producto.getPrecioMayorista());
            product.setCosto(producto.getCosto());
            product.setStock(producto.getStock());
            product.setStockMinimo(producto.getStockMinimo());
            product.setStockMaximo(producto.getStockMaximo());
            product.setIva(producto.getIva());
            product.setPorcentajeGanancia(producto.getPorcentajeGanancia() != null ? producto.getPorcentajeGanancia() : 1);

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
    public ProductoDTO findById(String id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));

        ProductoDTO productoDto = new ProductoDTO();
        productoDto.setIdProducto(producto.getIdProducto());
        productoDto.setNombre(producto.getNombre());
        productoDto.setPrecioDetal(producto.getPrecioDetal());
        productoDto.setPrecioMayorista(producto.getPrecioMayorista());
        productoDto.setCosto(producto.getCosto());
        productoDto.setStock(producto.getStock());
        productoDto.setStockMinimo(producto.getStockMinimo());
        productoDto.setStockMaximo(producto.getStockMaximo());
        productoDto.setIva(producto.getIva());
        productoDto.setPorcentajeGanancia(producto.getPorcentajeGanancia() != null ? producto.getPorcentajeGanancia() : 1);

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

    // Crear un producto recibiendo los datos en DTO
    @Transactional
    public ProductoDTO crearProductoDesdeDTO(ProductoDTO productoDTO) {
        // Validaciones
        if (productoDTO.getIdProducto() == null || !productoDTO.getIdProducto().matches("^[a-zA-Z0-9-_]+$")) {
            throw new RuntimeException("El ID del producto debe contener solo letras, números, guiones o guiones bajos.");
        }
        if (productoRepository.existsById(productoDTO.getIdProducto())) {
            throw new RuntimeException("Ya existe un producto con el ID: " + productoDTO.getIdProducto());
        }
        if (productoDTO.getNombre() == null || productoDTO.getNombre().trim().isEmpty() || productoDTO.getNombre().length() < 3) {
            throw new RuntimeException("El nombre debe tener al menos 3 caracteres.");
        }
        if (!productoDTO.getNombre().matches("^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\\s-_]+$")) {
            throw new RuntimeException("El nombre solo puede contener letras, números, espacios, guiones o guiones bajos.");
        }
        if (productoDTO.getPrecioDetal() == null || productoDTO.getPrecioDetal() <= 0) {
            throw new RuntimeException("El precio detal debe ser mayor que 0");
        }
        if (productoDTO.getPrecioMayorista() != null && productoDTO.getPrecioMayorista() <= 0) {
            throw new RuntimeException("El precio mayorista debe ser mayor que 0");
        }
        if (productoDTO.getStockMinimo() != null && productoDTO.getStockMinimo() < 0) {
            throw new RuntimeException("El stock mínimo no puede ser negativo");
        }
        if (productoDTO.getStockMaximo() != null && productoDTO.getStockMaximo() < 0) {
            throw new RuntimeException("El stock máximo no puede ser negativo");
        }
        if (productoDTO.getIva() == null) {
            throw new RuntimeException("Debes especificar si el producto tiene IVA (true/false).");
        }


        Categoria categoria = null;
        if (productoDTO.getIdCategoria() != null) {
            categoria = categoriaRepository.findById(productoDTO.getIdCategoria().getIdCategoria())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + productoDTO.getIdCategoria().getIdCategoria()));
        }

        // Asegurar que porcentajeGanancia tenga un valor mínimo de 1 y un maximo de 100
        Integer porcentaje = productoDTO.getPorcentajeGanancia() != null ? productoDTO.getPorcentajeGanancia() : 1;
        if (porcentaje < 1) porcentaje = 1;
        if (porcentaje > 100) porcentaje = 100;

        Producto producto = Producto.builder()
                .idProducto(productoDTO.getIdProducto())
                .nombre(productoDTO.getNombre())
                .precioDetal(productoDTO.getPrecioDetal())
                .precioMayorista(productoDTO.getPrecioMayorista())
                .costo(productoDTO.getCosto() != null ? productoDTO.getCosto() : 0)
                .stock(productoDTO.getStock() != null ? productoDTO.getStock() : 0)
                .stockMinimo(productoDTO.getStockMinimo())
                .stockMaximo(productoDTO.getStockMaximo())
                .iva(productoDTO.getIva())
                .porcentajeGanancia(porcentaje)
                .idCategoria(categoria)
                .build();
        producto = productoRepository.save(producto);

        Producto finalProducto = producto;
        List<MateriaProducto> materias = productoDTO.getMaterias() != null
                ? productoDTO.getMaterias().stream().map(dto -> {
            if (!materiaRepository.existsById(dto.getIdMateria())) {
                throw new RuntimeException("Materia con ID " + dto.getIdMateria() + " no encontrada");
            }
            if (dto.getCantidad() <= 0) {
                throw new RuntimeException("La cantidad de materia prima debe ser mayor que 0");
            }
            MateriaProducto mp = new MateriaProducto();
            mp.setIdMateria(dto.getIdMateria());
            mp.setCantidad(dto.getCantidad());
            mp.setProducto(finalProducto);
            return mp;
        }).collect(Collectors.toList())
                : new ArrayList<>();
        producto.setMaterias(materias);
        productoRepository.save(producto);

        // Set the generated ID back to DTO
        productoDTO.setIdProducto(producto.getIdProducto());

        return productoDTO;
    }

    // Actualizar un producto desde DTO
    @Transactional
    public ProductoDTO actualizarProductoDesdeDTO(ProductoDTO productoDTO) {
        Producto producto = productoRepository.findById(productoDTO.getIdProducto())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + productoDTO.getIdProducto()));

        // Validaciones
        if (!productoDTO.getIdProducto().matches("^[a-zA-Z0-9-_]+$")) {
            throw new RuntimeException("El ID del producto debe contener solo letras, números, guiones o guiones bajos.");
        }
        if (productoDTO.getNombre() == null || productoDTO.getNombre().trim().isEmpty() || productoDTO.getNombre().length() < 3) {
            throw new RuntimeException("El nombre debe tener al menos 3 caracteres.");
        }
        if (!productoDTO.getNombre().matches("^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\\s-_]+$")) {
            throw new RuntimeException("El nombre solo puede contener letras, números, espacios, guiones o guiones bajos.");
        }
        if (productoDTO.getPrecioDetal() == null || productoDTO.getPrecioDetal() <= 0) {
            throw new RuntimeException("El precio detal debe ser mayor que 0");
        }

        // Actualizar campos simples
        producto.setNombre(productoDTO.getNombre());
        producto.setPrecioDetal(productoDTO.getPrecioDetal());
        producto.setPrecioMayorista(productoDTO.getPrecioMayorista());
        producto.setCosto(productoDTO.getCosto() != null ? productoDTO.getCosto() : 0);
        producto.setStock(productoDTO.getStock());
        producto.setStockMinimo(productoDTO.getStockMinimo());
        producto.setStockMaximo(productoDTO.getStockMaximo());
        producto.setIva(productoDTO.getIva());

        // Actualizar porcentajeGanancia
        Integer porcentaje = productoDTO.getPorcentajeGanancia() != null ? productoDTO.getPorcentajeGanancia() : 1;
        if (porcentaje < 1) porcentaje = 1;
        if (porcentaje > 100) porcentaje = 100;

        producto.setPorcentajeGanancia(porcentaje);

        // Manejar categoría
        if (productoDTO.getIdCategoria() != null && productoDTO.getIdCategoria().getIdCategoria() != null) {
            Categoria categoria = categoriaRepository.findById(productoDTO.getIdCategoria().getIdCategoria())
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada con ID: " + productoDTO.getIdCategoria().getIdCategoria()));
            producto.setIdCategoria(categoria);
        } else {
            producto.setIdCategoria(null);
        }

        // Actualizar materias primas
        if (producto.getMaterias() == null) {
            producto.setMaterias(new ArrayList<>());
        }
        producto.getMaterias().clear();

        List<MateriaProducto> nuevasMaterias = productoDTO.getMaterias() != null
                ? productoDTO.getMaterias().stream().map(dto -> {
            if (!materiaRepository.existsById(dto.getIdMateria())) {
                throw new RuntimeException("Materia con ID " + dto.getIdMateria() + " no encontrada");
            }
            if (dto.getCantidad() <= 0) {
                throw new RuntimeException("La cantidad de materia prima debe ser mayor que 0");
            }
            MateriaProducto mp = new MateriaProducto();
            mp.setIdMateria(dto.getIdMateria());
            mp.setCantidad(dto.getCantidad());
            mp.setProducto(producto);
            return mp;
        }).collect(Collectors.toList())
                : new ArrayList<>();
        producto.getMaterias().addAll(nuevasMaterias);

        productoRepository.save(producto);
        return productoDTO;
    }

    // Metodo para guardar un producto
    @Transactional
    public Producto save(Producto producto) {
        if (producto.getIdProducto() == null || !producto.getIdProducto().matches("^[a-zA-Z0-9-_]+$")) {
            throw new RuntimeException("El ID del producto debe contener solo letras, números, guiones o guiones bajos.");
        }
        if (producto.getIdCategoria() != null && !categoriaRepository.existsById(producto.getIdCategoria().getIdCategoria())) {
            throw new RuntimeException("Categoría no encontrada");
        }
        if (producto.getMaterias() != null) {
            for (MateriaProducto mp : producto.getMaterias()) {
                if (!materiaRepository.existsById(mp.getIdMateria())) {
                    throw new RuntimeException("Materia con ID " + mp.getIdMateria() + " no encontrada");
                }
                if (mp.getCantidad() <= 0) {
                    throw new RuntimeException("La cantidad de materia prima debe ser mayor que 0");
                }
            }
        }
        return productoRepository.save(producto);
    }

    // Disminuir stock por pérdida
    @Transactional
    public Producto disminuirStockPorPerdida(String idProducto, int cantidadADisminuir, String notas) {
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
        movimiento.setTipoMovimiento("salida");
        movimiento.setFechaMovimiento(fechaActual);
        movimientoRepository.save(movimiento);

        // Actualizar stock del producto
        producto.setStock(nuevoStock);
        productoRepository.save(producto);

        return producto;
    }

    // Actualizar stock
    @Transactional
    public Producto updateStock(String idProducto, int nuevaCantidad, String nota) {
        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + idProducto));

        int stockActual = producto.getStock() != null ? producto.getStock() : 0;
        int diferencia = nuevaCantidad - stockActual;
        LocalDateTime fechaActual = LocalDateTime.now();

        // Registrar movimiento si hay cambio
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
            produccion.setNotas(nota);
            Produccion savedProduccion = produccionRepository.save(produccion);
            Long idProduccion = savedProduccion.getIdProduccion();

            for (MateriaProducto mp : producto.getMaterias()) {
                String idMateriaAumentar = mp.getIdMateria();
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

                    // Registrar ProduccionLote y LoteUsado
                    produccionLoteRepository.save(new ProduccionLote(idProduccion, lote.getIdLote(), usar));
                    LoteUsado loteUsado = new LoteUsado();
                    loteUsado.setIdProducto(idProducto);
                    loteUsado.setIdLote(lote.getIdLote());
                    loteUsado.setCantidadUsada(usar);
                    loteUsado.setFechaProduccion(fechaActual);
                    loteUsado.setIdProduccion(idProduccion);
                    loteUsado.setCantidadInicialLote(lote.getCantidad() != null ? lote.getCantidad() : 0f);
                    loteUsadoRepository.save(loteUsado);

                    restante -= usar;
                }
                // Recalcular cantidad disponible actual de la materia
                Float actualMateria = loteRepository.sumCantidadDisponibleByIdMateria(idMateriaAumentar);
                if (actualMateria == null) actualMateria = 0f;
                materia.setCantidad(actualMateria);
                materiaRepository.save(materia);

                // Registrar movimiento de materia
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
                        } else {
                            produccionLoteRepository.delete(prodLote);
                        }
                        loteRepository.save(lote);
                        restante -= devolver;
                    }
                }

                // Recalcular materia y registrar movimiento de materia (entrada)
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

        // Actualizar cantidades de materias relacionadas
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
    public void delete(String id) {
        materiaProductoRepository.deleteByProducto_IdProducto(id);
        productoRepository.deleteById(id);
    }

    // Disminuir stock
    public void disminuirStock(Producto producto, int cantidadComprada) {
        updateStock(producto.getIdProducto(), producto.getStock() - cantidadComprada, null);
    }

    // Recalcular costo y precios de productos
    @Transactional
    public void recalculateProductsCostByMateria(MateriaPrima materia) {
        double costoUnitarioMateria = materia.getCosto() != null ? materia.getCosto().doubleValue() : 0.0;
        List<MateriaProducto> relaciones = materiaProductoRepository.findByIdMateria(materia.getIdMateria());

        for (MateriaProducto rel : relaciones) {
            Producto producto = rel.getProducto() != null && rel.getProducto().getIdProducto() != null
                    ? productoRepository.findById(rel.getProducto().getIdProducto()).orElse(null)
                    : null;
            if (producto == null) {
                continue;
            }

            // Recalcular costo
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

            // Calcular nuevos precios preservando markup
            Integer oldCosto = producto.getCosto() != null ? producto.getCosto() : 0;
            Double oldPrecioDetal = producto.getPrecioDetal() != null ? producto.getPrecioDetal() : 0.0;
            Double oldPrecioMayorista = producto.getPrecioMayorista() != null ? producto.getPrecioMayorista() : 0.0;
            double nuevoPrecioDetalCalc;
            Double nuevoPrecioMayoristaCalc = null;

            if (oldCosto > 0) {
                double markupDetal = oldPrecioDetal / oldCosto;
                nuevoPrecioDetalCalc = nuevoCostoRedondeado * markupDetal;
                if (oldPrecioMayorista > 0.0) {
                    double markupMayorista = oldPrecioMayorista / oldCosto;
                    nuevoPrecioMayoristaCalc = nuevoCostoRedondeado * markupMayorista;
                }
            } else {
                nuevoPrecioDetalCalc = nuevoCostoRedondeado * (1 + (producto.getPorcentajeGanancia() != null ? producto.getPorcentajeGanancia() : 1) / 100.0);
                if (oldPrecioMayorista > 0.0) {
                    nuevoPrecioMayoristaCalc = nuevoCostoRedondeado * 1.10; // 10% por defecto para mayorista
                }
            }

            int nuevoPrecioDetalRedondeado = roundTo50(nuevoPrecioDetalCalc);
            Double nuevoPrecioMayoristaRedondeado = nuevoPrecioMayoristaCalc != null ? (double) roundTo50(nuevoPrecioMayoristaCalc) : null;

            // Persistir cambios
            boolean changed = false;
            if (producto.getCosto() == null || producto.getCosto().intValue() != nuevoCostoRedondeado) {
                producto.setCosto(nuevoCostoRedondeado);
                changed = true;
            }
            if (producto.getPrecioDetal() == null || producto.getPrecioDetal().intValue() != nuevoPrecioDetalRedondeado) {
                producto.setPrecioDetal((double) nuevoPrecioDetalRedondeado);
                changed = true;
            }
            if (producto.getPrecioMayorista() != nuevoPrecioMayoristaRedondeado) {
                producto.setPrecioMayorista(nuevoPrecioMayoristaRedondeado);
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