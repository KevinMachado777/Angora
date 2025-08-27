package Angora.app.Services;

import Angora.app.Entities.Cartera;
import Angora.app.Entities.Cliente;
import Angora.app.Entities.Factura;
import Angora.app.Entities.HistorialAbono;
import Angora.app.Repositories.CarteraRepository;
import Angora.app.Repositories.ClienteRepository;
import Angora.app.Repositories.FacturaRepository;
import Angora.app.Exceptions.RecursoNoEncontrado;
import Angora.app.Repositories.HistorialAbonoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

@Service
public class CarteraService implements ICarteraService {
    private static final Logger logger = LoggerFactory.getLogger(CarteraService.class);
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Autowired
    private CarteraRepository carteraRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private HistorialAbonoRepository historialAbonoRepository;

    @Override
    public Cartera obtenerPorIdCliente(Long idCliente) {
        logger.info("Buscando cartera para cliente con ID: {}", idCliente);
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID {} no encontrado", idCliente);
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera == null) {
            logger.warn("No se encontró cartera para el cliente con ID: {}", idCliente);
        } else {
            logger.info("Cartera encontrada para cliente con ID: {}", idCliente);
        }
        return cartera;
    }

    @Override
    public List<Cartera> obtenerCarterasActivas() {
        logger.info("Obteniendo todas las carteras activas");
        List<Cartera> carteras = carteraRepository.findByEstadoTrue();
        logger.info("Se encontraron {} carteras activas", carteras.size());
        return carteras;
    }

    @Override
    public Cartera procesarAbono(Long idCliente, Integer cantidad, String fecha, Long idFactura) {
        logger.info("Procesando abono de {} para cliente con ID: {}, factura ID: {}, fecha: {}", cantidad, idCliente, idFactura, fecha);

        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente));

        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera == null || !cartera.getEstado()) {
            throw new IllegalStateException("El cliente no tiene una cartera activa");
        }

        if (cantidad <= 0) {
            throw new IllegalArgumentException("El abono no puede ser menor o igual a 0");
        }

        List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        if (facturas.isEmpty()) {
            throw new IllegalStateException("No hay facturas para abonar");
        }
        facturas.sort(Comparator.comparing(Factura::getFecha));

        Factura facturaInicial = facturas.stream()
                .filter(f -> f.getIdFactura().equals(idFactura))
                .findFirst()
                .orElseThrow(() -> new RecursoNoEncontrado("Factura no encontrada con ID: " + idFactura));

        Double saldoAnteriorInicial = facturaInicial.getSaldoPendiente() != null ? facturaInicial.getSaldoPendiente() : 0.0;
        Double cantidadRestante = cantidad.doubleValue();

        Double nuevoSaldo = saldoAnteriorInicial - cantidadRestante;
        if (nuevoSaldo < 0) {
            cantidadRestante = -nuevoSaldo;
            facturaInicial.setSaldoPendiente(0.0);
        } else {
            facturaInicial.setSaldoPendiente(nuevoSaldo);
            cantidadRestante = 0.0;
        }
        facturaRepository.save(facturaInicial);

        HistorialAbono historial = new HistorialAbono();
        historial.setCliente(cliente);
        historial.setFactura(facturaInicial);
        historial.setMontoAbono((float) (cantidad.doubleValue() - cantidadRestante));
        historial.setSaldoAnterior(saldoAnteriorInicial.floatValue());
        historial.setSaldoNuevo(facturaInicial.getSaldoPendiente().floatValue());
        historial.setFechaAbono(fecha != null ? LocalDateTime.parse(fecha, DATE_TIME_FORMATTER) : LocalDateTime.now());
        historial.setDescripcion("Abono aplicado a factura #" + facturaInicial.getIdFactura());
        historialAbonoRepository.save(historial);

        if (cantidadRestante > 0) {
            List<Factura> facturasRestantes = facturas.stream()
                    .filter(f -> !f.getIdFactura().equals(idFactura) && (f.getSaldoPendiente() != null && f.getSaldoPendiente() > 0))
                    .sorted(Comparator.comparing(Factura::getFecha))
                    .toList();

            for (Factura factura : facturasRestantes) {
                Double saldoAnterior = factura.getSaldoPendiente() != null ? factura.getSaldoPendiente() : 0.0;
                nuevoSaldo = saldoAnterior - cantidadRestante;
                Double montoAplicado;

                if (nuevoSaldo < 0) {
                    montoAplicado = cantidadRestante + nuevoSaldo;
                    cantidadRestante = -nuevoSaldo;
                    factura.setSaldoPendiente(0.0);
                } else {
                    montoAplicado = cantidadRestante;
                    factura.setSaldoPendiente(nuevoSaldo);
                    cantidadRestante = 0.0;
                }
                facturaRepository.save(factura);

                HistorialAbono historialExcedente = new HistorialAbono();
                historialExcedente.setCliente(cliente);
                historialExcedente.setFactura(factura);
                historialExcedente.setMontoAbono(montoAplicado.floatValue());
                historialExcedente.setSaldoAnterior(saldoAnterior.floatValue());
                historialExcedente.setSaldoNuevo(factura.getSaldoPendiente().floatValue());
                historialExcedente.setFechaAbono(fecha != null ? LocalDateTime.parse(fecha, DATE_TIME_FORMATTER) : LocalDateTime.now());
                historialExcedente.setDescripcion("Excedente aplicado desde factura #" + facturaInicial.getIdFactura());
                historialAbonoRepository.save(historialExcedente);

                if (cantidadRestante == 0) break;
            }
        }

        // Recalcular deudas, abono y crédito a favor
        List<Factura> todasLasFacturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        Float nuevasDeudas = (float) todasLasFacturas.stream()
                .mapToDouble(f -> f.getSaldoPendiente() != null ? f.getSaldoPendiente() : 0.0)
                .sum();
        Float nuevoAbono = (cartera.getAbono() != null ? cartera.getAbono() : 0f) + cantidad.floatValue();

        Float nuevoCreditoAFavor = (cantidadRestante > 0 && nuevasDeudas == 0) ?
                (cartera.getCreditoAFavor() != null ? cartera.getCreditoAFavor() : 0f) + cantidadRestante.floatValue() : 0f;

        cartera.setAbono(nuevoAbono);
        cartera.setDeudas(nuevasDeudas);
        cartera.setCreditoAFavor(nuevoCreditoAFavor);
        Cartera carteraActualizada = carteraRepository.save(cartera);

        // Actualizar facturas activas
        List<Factura> facturasActivas = todasLasFacturas.stream()
                .filter(f -> f.getSaldoPendiente() != null && f.getSaldoPendiente() > 0)
                .toList();
        carteraActualizada.setFacturas(facturasActivas);

        logger.info("Abono procesado. Nuevo saldo pendiente: {}, Crédito a favor: {}, Dinero restante sin aplicar: {}",
                carteraActualizada.getDeudas(), carteraActualizada.getCreditoAFavor(), cantidadRestante);
        return carteraActualizada;
    }

    @Override
    public Cartera actualizarEstadoCartera(Long idCliente, Boolean estado) {
        logger.info("Actualizando estado de cartera para cliente con ID: {} a {}", idCliente, estado);
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID {} no encontrado", idCliente);
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera == null) {
            logger.warn("No se encontró cartera para el cliente con ID: {}", idCliente);
            cartera = new Cartera();
            cartera.setIdCliente(clienteRepository.findById(idCliente).get());
            cartera.setDeudas(0f);
            cartera.setAbono(0f);
            cartera.setEstado(estado);
        } else {
            List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
            if (estado == false && facturas.stream().anyMatch(f -> f.getSaldoPendiente() != null && f.getSaldoPendiente() > 0)) {
                logger.error("No se puede desactivar la cartera con facturas pendientes");
                throw new IllegalStateException("No se puede desactivar la cartera con facturas pendientes");
            }
            cartera.setEstado(estado);
        }
        Cartera carteraActualizada = carteraRepository.save(cartera);
        logger.info("Estado de cartera actualizado para cliente con ID: {}", idCliente);
        return carteraActualizada;
    }

    @Override
    public Cartera obtenerPorIdClienteConFacturas(Long idCliente) {
        Cartera cartera = obtenerPorIdCliente(idCliente);
        if (cartera != null) {
            List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
            cartera.setFacturas(facturas);
        }
        return cartera;
    }

    @Override
    public List<HistorialAbono> obtenerHistorialAbonos(Long idCliente) {
        logger.info("Obteniendo historial de abonos para cliente con ID: {}", idCliente);
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID {} no encontrado", idCliente);
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        List<HistorialAbono> historial = historialAbonoRepository.findByClienteIdClienteOrderByFechaAbonoDesc(idCliente);
        logger.info("Se encontraron {} registros de abonos para el cliente", historial.size());
        return historial;
    }
}