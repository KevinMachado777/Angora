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
import java.util.Comparator;
import java.util.List;

// Servicio para gestionar las operaciones de carteras y abonos
@Service
public class CarteraService implements ICarteraService {
    private static final Logger logger = LoggerFactory.getLogger(CarteraService.class);

    @Autowired
    private CarteraRepository carteraRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private HistorialAbonoRepository historialAbonoRepository;

    // Busca la cartera de un cliente por su ID
    @Override
    public Cartera obtenerPorIdCliente(Long idCliente) {
        logger.info("Buscando cartera para cliente con ID: " + idCliente);
        // Verifica que el cliente exista
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera == null) {
            logger.warn("No se encontró cartera para el cliente con ID: " + idCliente);
        } else {
            logger.info("Cartera encontrada para cliente con ID: " + idCliente);
        }
        return cartera;
    }

    // Obtiene todas las carteras activas
    @Override
    public List<Cartera> obtenerCarterasActivas() {
        logger.info("Obteniendo todas las carteras activas");
        List<Cartera> carteras = carteraRepository.findByEstadoTrue();
        logger.info("Se encontraron " + carteras.size() + " carteras activas");
        return carteras;
    }

    // Procesa un abono para una factura específica de un cliente y almacena el historial
    @Override
    public Cartera procesarAbono(Long idCliente, Integer cantidad, String fecha, Long idFactura) {
        logger.info("Procesando abono de " + cantidad + " para cliente con ID: " + idCliente + ", factura ID: " + idFactura);

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

        Integer saldoAnteriorInicial = facturaInicial.getSaldoPendiente();
        Integer cantidadRestante = cantidad;

        Integer nuevoSaldo = facturaInicial.getSaldoPendiente() - cantidadRestante;
        if (nuevoSaldo < 0) {
            cantidadRestante = -nuevoSaldo;
            facturaInicial.setSaldoPendiente(0);
        } else {
            facturaInicial.setSaldoPendiente(nuevoSaldo);
            cantidadRestante = 0;
        }
        facturaRepository.save(facturaInicial);

        HistorialAbono historial = new HistorialAbono();
        historial.setCliente(cliente);
        historial.setFactura(facturaInicial);
        historial.setMontoAbono(Float.valueOf(cantidad - (cantidadRestante > 0 ? cantidadRestante : 0)));
        historial.setSaldoAnterior(Float.valueOf(saldoAnteriorInicial));
        historial.setSaldoNuevo(Float.valueOf(facturaInicial.getSaldoPendiente()));
        historial.setFechaAbono(LocalDateTime.now());
        historial.setDescripcion("Abono aplicado a factura #" + facturaInicial.getIdFactura());
        historialAbonoRepository.save(historial);

        if (cantidadRestante > 0) {
            List<Factura> facturasRestantes = facturas.stream()
                    .filter(f -> !f.getIdFactura().equals(idFactura) && f.getSaldoPendiente() > 0)
                    .sorted(Comparator.comparing(Factura::getFecha))
                    .toList();

            for (Factura factura : facturasRestantes) {
                Integer saldoAnterior = factura.getSaldoPendiente();
                nuevoSaldo = factura.getSaldoPendiente() - cantidadRestante;
                Integer montoAplicado;

                if (nuevoSaldo < 0) {
                    montoAplicado = cantidadRestante + nuevoSaldo;
                    cantidadRestante = -nuevoSaldo;
                    factura.setSaldoPendiente(0);
                } else {
                    montoAplicado = cantidadRestante;
                    factura.setSaldoPendiente(nuevoSaldo);
                    cantidadRestante = 0;
                }
                facturaRepository.save(factura);

                HistorialAbono historialExcedente = new HistorialAbono();
                historialExcedente.setCliente(cliente);
                historialExcedente.setFactura(factura);
                historialExcedente.setMontoAbono(Float.valueOf(montoAplicado));
                historialExcedente.setSaldoAnterior(Float.valueOf(saldoAnterior));
                historialExcedente.setSaldoNuevo(Float.valueOf(factura.getSaldoPendiente()));
                historialExcedente.setFechaAbono(LocalDateTime.now());
                historialExcedente.setDescripcion("Excedente aplicado desde factura #" + facturaInicial.getIdFactura());
                historialAbonoRepository.save(historialExcedente);

                if (cantidadRestante == 0) break;
            }
        }

        // Recalcular deudas, abono y crédito a favor
        List<Factura> todasLasFacturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        float nuevasDeudas = todasLasFacturas.stream().mapToInt(Factura::getSaldoPendiente).sum();
        Float nuevoAbono = cartera.getAbono() + cantidad;

        // Calcular crédito a favor considerando nuevas facturas
        float nuevoCreditoAFavor = (cantidadRestante > 0 && nuevasDeudas == 0) ? cartera.getCreditoAFavor() + cantidadRestante : 0f;
        if (nuevoCreditoAFavor > 0 && nuevasDeudas == 0) {
            cartera.setCreditoAFavor(nuevoCreditoAFavor);
        } else {
            cartera.setCreditoAFavor(0f); // Resetear si hay deudas
        }

        cartera.setAbono(nuevoAbono);
        cartera.setDeudas(nuevasDeudas);
        Cartera carteraActualizada = carteraRepository.save(cartera);

        // Actualizar facturas activas
        List<Factura> facturasActivas = todasLasFacturas.stream().filter(f -> f.getSaldoPendiente() > 0).toList();
        carteraActualizada.setFacturas(facturasActivas);

        logger.info("Abono procesado. Nuevo saldo pendiente: " + carteraActualizada.getDeudas() +
                ", Crédito a favor: " + carteraActualizada.getCreditoAFavor() +
                ", Dinero restante sin aplicar: " + cantidadRestante);
        return carteraActualizada;
    }

    // Actualiza el estado de la cartera de un cliente (activa/inactiva)
    @Override
    public Cartera actualizarEstadoCartera(Long idCliente, Boolean estado) {
        logger.info("Actualizando estado de cartera para cliente con ID: " + idCliente + " a " + estado);
        // Verifica que el cliente exista
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        // Busca la cartera o crea una nueva si no existe
        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera == null) {
            logger.warn("No se encontró cartera para el cliente con ID: " + idCliente);
            cartera = new Cartera();
            cartera.setIdCliente(clienteRepository.findById(idCliente).get());
            cartera.setDeudas(0f);
            cartera.setAbono(0f);
            cartera.setEstado(estado);
        } else {
            // Impide desactivar si hay facturas con saldo pendiente
            List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
            if (estado == false && facturas.stream().anyMatch(f -> f.getSaldoPendiente() > 0)) {
                logger.error("No se puede desactivar la cartera con facturas pendientes");
                throw new IllegalStateException("No se puede desactivar la cartera con facturas pendientes");
            }
            cartera.setEstado(estado);
        }
        Cartera carteraActualizada = carteraRepository.save(cartera);
        logger.info("Estado de cartera actualizado para cliente con ID: " + idCliente);
        return carteraActualizada;
    }

    // Busca la cartera de un cliente con sus facturas para el frontend
    public Cartera obtenerPorIdClienteConFacturas(Long idCliente) {
        Cartera cartera = obtenerPorIdCliente(idCliente);
        if (cartera != null) {
            // Añade las facturas asociadas a la cartera
            List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
            cartera.setFacturas(facturas);
        }
        return cartera;
    }

    // Metodo para obtener historial de abonos
    public List<HistorialAbono> obtenerHistorialAbonos(Long idCliente) {
        logger.info("Obteniendo historial de abonos para cliente con ID: " + idCliente);

        // Verifica que el cliente exista
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });

        List<HistorialAbono> historial = historialAbonoRepository.findByClienteIdClienteOrderByFechaAbonoDesc(idCliente);
        logger.info("Se encontraron " + historial.size() + " registros de abonos para el cliente");
        return historial;
    }
}