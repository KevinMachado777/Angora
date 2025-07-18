package Angora.app.Services;

import Angora.app.Entities.Cartera;
import Angora.app.Entities.Factura;
import Angora.app.Repositories.CarteraRepository;
import Angora.app.Repositories.ClienteRepository;
import Angora.app.Repositories.FacturaRepository;
import Angora.app.Exceptions.RecursoNoEncontrado;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    // Procesa un abono para una factura específica de un cliente
    @Override
    public Cartera procesarAbono(Long idCliente, Double cantidad, String fecha, Long idFactura) {
        logger.info("Procesando abono de " + cantidad + " para cliente con ID: " + idCliente + ", factura ID: " + idFactura);
        // Verifica que el cliente exista
        clienteRepository.findById(idCliente)
                .orElseThrow(() -> {
                    logger.error("Cliente con ID " + idCliente + " no encontrado");
                    return new RecursoNoEncontrado("Cliente no encontrado con ID: " + idCliente);
                });
        // Verifica que la cartera exista y esté activa
        Cartera cartera = carteraRepository.findByIdCliente_IdCliente(idCliente);
        if (cartera == null || !cartera.getEstado()) {
            logger.error("El cliente con ID " + idCliente + " no tiene una cartera activa");
            throw new IllegalStateException("El cliente no tiene una cartera activa");
        }
        // Valida que el abono sea mayor a 0
        if (cantidad <= 0) {
            logger.error("Cantidad de abono inválida: " + cantidad);
            throw new IllegalArgumentException("El abono no puede ser menor o igual a 0");
        }
        // Valida que el abono no exceda la deuda total
        if (cantidad > cartera.getDeudas()) {
            logger.error("El abono de " + cantidad + " excede la deuda total de " + cartera.getDeudas());
            throw new IllegalArgumentException("El abono no puede ser mayor al saldo pendiente total de la cartera.");
        }
        // Valida que el abono sea múltiplo de 50
        if (cantidad % 50 != 0) {
            logger.error("El abono de " + cantidad + " no es un múltiplo de 50.");
            throw new IllegalArgumentException("El abono debe ser un valor en múltiplos de 50 (ejemplo: 15.850).");
        }
        // Valida que el abono sea mínimo 2.000
        if (cantidad < 500) {
            logger.error("El abono de " + cantidad + " es menor al mínimo de 2.000.");
            throw new IllegalArgumentException("El abono debe ser al menos 2.000.");
        }
        // Obtiene las facturas de la cartera
        List<Factura> facturas = facturaRepository.findByIdCarteraIdCartera(cartera.getIdCartera());
        if (facturas.isEmpty()) {
            logger.error("No hay facturas asociadas a la cartera del cliente con ID: " + idCliente);
            throw new IllegalStateException("No hay facturas para abonar");
        }
        // Ordena facturas por fecha (de más antigua a más reciente)
        facturas.sort(Comparator.comparing(Factura::getFecha));
        // Busca la factura seleccionada
        Factura facturaInicial = facturas.stream()
                .filter(f -> f.getIdFactura().equals(idFactura))
                .findFirst()
                .orElseThrow(() -> {
                    logger.error("Factura con ID " + idFactura + " no encontrada");
                    return new RecursoNoEncontrado("Factura no encontrada con ID: " + idFactura);
                });
        // Aplica el abono a la factura seleccionada
        double cantidadRestante = cantidad;
        float nuevoSaldo = facturaInicial.getSaldoPendiente() - (float) cantidadRestante;
        if (nuevoSaldo < 0) {
            cantidadRestante = -nuevoSaldo;
            facturaInicial.setSaldoPendiente(0f);
        } else {
            facturaInicial.setSaldoPendiente(nuevoSaldo);
            cantidadRestante = 0;
        }
        facturaRepository.save(facturaInicial);
        // Distribuye el excedente a otras facturas en orden de fecha
        if (cantidadRestante > 0) {
            for (Factura factura : facturas) {
                if (!factura.getIdFactura().equals(idFactura) && factura.getSaldoPendiente() > 0) {
                    nuevoSaldo = factura.getSaldoPendiente() - (float) cantidadRestante;
                    if (nuevoSaldo < 0) {
                        cantidadRestante = -nuevoSaldo;
                        factura.setSaldoPendiente(0f);
                    } else {
                        factura.setSaldoPendiente(nuevoSaldo);
                        cantidadRestante = 0;
                    }
                    facturaRepository.save(factura);
                    if (cantidadRestante == 0) break;
                }
            }
        }
        // Actualiza el total de deudas y abonos en la cartera
        float nuevasDeudas = facturas.stream()
                .map(Factura::getSaldoPendiente)
                .reduce(0f, Float::sum);
        Float nuevoAbono = (float) (cartera.getAbono() + cantidad);
        cartera.setAbono(nuevoAbono);
        cartera.setDeudas(nuevasDeudas);
        Cartera carteraActualizada = carteraRepository.save(cartera);
        // Filtra facturas activas (con saldo pendiente) para el frontend
        List<Factura> facturasActivas = facturas.stream()
                .filter(f -> f.getSaldoPendiente() > 0)
                .toList();
        carteraActualizada.setFacturas(facturasActivas);
        logger.info("Abono procesado. Nuevo saldo pendiente: " + carteraActualizada.getDeudas());
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
}