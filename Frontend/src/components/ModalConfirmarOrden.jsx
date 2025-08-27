import React, { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import Modal from "./Modal";
import BotonAceptar from "./BotonAceptar";
import BotonCancelar from "./BotonCancelar";

const ModalConfirmarOrden = ({ isOpen, onClose, orden, onConfirmar }) => {
  const [lotesIds, setLotesIds] = useState({});
  const [costosUnitarios, setCostosUnitarios] = useState({});
  const [errores, setErrores] = useState({});
  const [modalError, setModalError] = useState({ 
    visible: false, 
    mensaje: "", 
    inputFocus: null 
  });
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [totalOrden, setTotalOrden] = useState(0);
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 4; 
  const [modalMensaje, setModalMensaje] = useState({
    tipo: "",
    mensaje: "",
    visible: false,
  });

  const abrirModal = (tipo, mensaje) => {
    setModalMensaje({ tipo, mensaje, visible: true });
    setTimeout(() => {
      setModalMensaje({ tipo: "", mensaje: "", visible: false });
    }, 3000);
  };

  // Calcular total de la orden
  useEffect(() => {
    if (orden && orden.ordenMateriaPrimas) {
      const total = orden.ordenMateriaPrimas.reduce((acc, item) => {
        const idMateria = item.materiaPrima?.idMateria || item.idMateria;
        const costo = costosUnitarios[idMateria] || 0;
        const cantidad = item.cantidad || 0;
        return acc + (costo * cantidad);
      }, 0);
      setTotalOrden(total);
    }
  }, [costosUnitarios, orden]);

  useEffect(() => {
    if (isOpen && orden) {
      // Inicializar los inputs de lotes y costos
      const idsIniciales = {};
      const costosIniciales = {};
      
      if (orden.ordenMateriaPrimas && Array.isArray(orden.ordenMateriaPrimas)) {
        orden.ordenMateriaPrimas.forEach(item => {
          const idMateria = item.materiaPrima?.idMateria || item.idMateria;
          if (idMateria) {
            idsIniciales[idMateria] = "";
            costosIniciales[idMateria] = 0;
          }
        });

        // Cargar costos del último lote para cada materia prima
        const cargarCostos = async () => {
          const costosActualizados = { ...costosIniciales };
          
          for (const item of orden.ordenMateriaPrimas) {
            const idMateria = item.materiaPrima?.idMateria || item.idMateria;
            try {
              const response = await api.get(`/lotes/ultimo/${idMateria}`);
              if (response.data && response.data.costoUnitario) {
                costosActualizados[idMateria] = parseFloat(response.data.costoUnitario);
              }
            } catch (error) {
              console.log(`No se encontró lote previo para materia ${idMateria}, usando costo 0`);
            }
          }
          
          setCostosUnitarios(costosActualizados);
        };

        cargarCostos();
      }
      
      setLotesIds(idsIniciales);
      setErrores({});
      setModalError({ visible: false, mensaje: "", inputFocus: null });
      setPaginaActual(1);
    }
  }, [isOpen, orden]);

  const validarLotesUnicos = () => {
    const valoresLotes = Object.values(lotesIds).filter(id => id.trim() !== "");
    const valoresUnicos = [...new Set(valoresLotes)];
    
    if (valoresLotes.length !== valoresUnicos.length) {
      const duplicados = valoresLotes.filter((item, index) => valoresLotes.indexOf(item) !== index);
      const loteRepetido = duplicados[0];
      
      const materiaConError = Object.keys(lotesIds).find(key => 
        lotesIds[key] === loteRepetido
      );
      
      setModalError({
        visible: true,
        mensaje: `El ID de lote "${loteRepetido}" está repetido. Por favor, ingresa un ID único para cada materia prima.`,
        inputFocus: materiaConError
      });
      return false;
    }
    return true;
  };

  const handleLoteIdChange = (idMateria, valor) => {
    setLotesIds(prev => ({
      ...prev,
      [idMateria]: valor
    }));
    
    if (errores[idMateria]) {
      setErrores(prev => {
        const newErrores = { ...prev };
        delete newErrores[idMateria];
        return newErrores;
      });
    }
  };

  const handleCostoChange = (idMateria, value) => {
    setCostosUnitarios(prev => ({
      ...prev,
      [idMateria]: parseFloat(value) || 0
    }));
  };

  const handleConfirmar = async () => {
    // Validar que todos los campos estén llenos
    const camposVacios = Object.keys(lotesIds).filter(key => !lotesIds[key].trim());
    if (camposVacios.length > 0) {
      const nuevosErrores = {};
      camposVacios.forEach(key => {
        nuevosErrores[key] = "Este campo es obligatorio";
      });
      setErrores(nuevosErrores);
      abrirModal("advertencia", "Por favor complete todos los campos de ID de lote.");
      return;
    }

    // Validar que no haya costos en 0 o negativos
    const costosInvalidos = Object.keys(costosUnitarios).filter(key => 
      !costosUnitarios[key] || costosUnitarios[key] <= 0
    );
    if (costosInvalidos.length > 0) {
      abrirModal("advertencia", "Todos los costos unitarios deben ser mayores a 0.");
      return;
    }

    // Validar que no haya lotes repetidos
    if (!validarLotesUnicos()) {
      return;
    }

    // Validar que los IDs de lote no existan ya en el sistema
    try {
      const idsLotes = Object.values(lotesIds).filter(id => id.trim() !== "");
      for (const idLote of idsLotes) {
        try {
          const response = await api.get(`/lotes/${idLote}`);
          if (response.data) {
            setModalError({
              visible: true,
              mensaje: `El ID de lote "${idLote}" ya existe en el sistema. Por favor, ingresa un ID diferente.`,
              inputFocus: Object.keys(lotesIds).find(key => lotesIds[key] === idLote)
            });
            return;
          }
        } catch (error) {
          if (error.response?.status !== 404) {
            console.error("Error verificando lote:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error validando lotes:", error);
      setModalError({
        visible: true,
        mensaje: "Error al validar los IDs de lote. Intenta nuevamente.",
        inputFocus: null
      });
      return;
    }

    // Mostrar modal de confirmación
    setModalConfirmacion(true);
  };

  const confirmarOrden = async () => {
    try {
      // Crear el objeto de confirmación con los lotes y sus costos
      const confirmacionData = {
        lotesIds: lotesIds,
        lotes: orden.ordenMateriaPrimas.map(item => {
          const idMateria = item.materiaPrima?.idMateria || item.idMateria;
          return {
            idLote: lotesIds[idMateria],
            idMateria: idMateria,
            costoUnitario: costosUnitarios[idMateria],
            cantidad: item.cantidad,
            cantidadDisponible: item.cantidad,
            idProveedor: orden.proveedor.idProveedor,
            idOrden: orden.idOrden
          };
        }),
        totalOrden: totalOrden
      };

      onConfirmar(orden.idOrden, confirmacionData);
      setModalConfirmacion(false);
      
    } catch (error) {
      console.error("Error al confirmar orden:", error);
      abrirModal("error", `Error al confirmar orden: ${error.message}`);
    }
  };

  const cerrarModalError = () => {
    const inputFocus = modalError.inputFocus;
    setModalError({ visible: false, mensaje: "", inputFocus: null });
    
    if (inputFocus) {
      setTimeout(() => {
        const input = document.getElementById(`lote-${inputFocus}`);
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    }
  };

  const obtenerNombreMateria = (item) => {
    return item.materiaPrima?.nombre || item.nombre || "Materia desconocida";
  };

  const obtenerIdMateria = (item) => {
    return item.materiaPrima?.idMateria || item.idMateria;
  };

  // Lógica de paginación
  const items = orden?.ordenMateriaPrimas || [];
  const totalPaginas = Math.ceil(items.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const itemsPaginaActual = items.slice(indiceInicio, indiceFin);

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  if (!orden) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="modal-content" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          <div className="encabezado-modal">
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>Confirmar Orden #{orden?.idOrden}</h3>
          </div>
          
          <div className="mb-2" style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '8px 10px', 
            borderRadius: '5px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
              <span><strong>Proveedor:</strong> {orden.proveedor?.nombre}</span>
              <span style={{
                fontWeight: "bold",
                fontSize: "1rem",
                color: "#28a745"
              }}>
                Total: ${totalOrden.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="grupo-formulario">
            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>Datos de los lotes:</h5>
            
            {/* Tabla ultra-compacta para 5 registros */}
            <div>
              <table className="table table-sm table-bordered" style={{ 
                fontSize: '0.8rem',
                marginBottom: '0'
              }}>
                <thead style={{ backgroundColor: '#e9ecef' }}>
                  <tr style={{ height: '28px' }}>
                    <th style={{ width: '32%', padding: '4px 6px', verticalAlign: 'middle', fontSize: '0.75rem' }}>Materia Prima</th>
                    <th style={{ width: '8%', padding: '4px 6px', verticalAlign: 'middle', textAlign: 'center', fontSize: '0.75rem' }}>Cant.</th>
                    <th style={{ width: '25%', padding: '4px 6px', verticalAlign: 'middle', fontSize: '0.75rem' }}>ID Lote</th>
                    <th style={{ width: '18%', padding: '4px 6px', verticalAlign: 'middle', fontSize: '0.75rem' }}>Costo Unit.</th>
                    <th style={{ width: '17%', padding: '4px 6px', verticalAlign: 'middle', textAlign: 'right', fontSize: '0.75rem' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsPaginaActual.map((item, index) => {
                    const idMateria = obtenerIdMateria(item);
                    const nombreMateria = obtenerNombreMateria(item);
                    
                    if (!idMateria) return null;
                    
                    return (
                      <tr key={`${idMateria}-${index}`} style={{ height: '42px' }}>
                        <td style={{ padding: '4px 6px', verticalAlign: 'middle' }}>
                          <div style={{ lineHeight: '1' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>{nombreMateria}</div>
                            <div style={{ fontSize: '0.65rem', color: '#6c757d', marginTop: '2px' }}>ID: {idMateria}</div>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '4px 6px', 
                          verticalAlign: 'middle', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}>
                          {item.cantidad}
                        </td>
                        <td style={{ padding: '4px 3px', verticalAlign: 'middle' }}>
                          <input
                            id={`lote-${idMateria}`}
                            type="text"
                            className={`form-control form-control-sm ${errores[idMateria] ? 'is-invalid' : ''}`}
                            placeholder="ID único"
                            value={lotesIds[idMateria] || ""}
                            onChange={(e) => handleLoteIdChange(idMateria, e.target.value)}
                            style={{ 
                              fontSize: '0.75rem',
                              height: '26px',
                              padding: '2px 4px'
                            }}
                          />
                          {errores[idMateria] && (
                            <div className="invalid-feedback" style={{ fontSize: '0.65rem' }}>
                              {errores[idMateria]}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '4px 3px', verticalAlign: 'middle' }}>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={costosUnitarios[idMateria] || ""}
                            onChange={(e) => handleCostoChange(idMateria, e.target.value)}
                            style={{ 
                              fontSize: '0.75rem',
                              height: '26px',
                              padding: '2px 4px'
                            }}
                          />
                        </td>
                        <td style={{ 
                          padding: '4px 6px',
                          verticalAlign: 'middle', 
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: '#28a745',
                          fontSize: '0.75rem'
                        }}>
                          ${((costosUnitarios[idMateria] || 0) * item.cantidad).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Controles de paginación más compactos */}
            {totalPaginas > 1 && (
              <div className="d-flex justify-content-center align-items-center mt-3">
                <button
                  className="btn btn-outline-primary btn-sm me-2"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                >
                  ‹ Ant
                </button>
                
                <span className="mx-2" style={{ fontSize: '0.85rem' }}>
                  {paginaActual} de {totalPaginas}
                </span>
                
                <button
                  className="btn btn-outline-primary btn-sm ms-2"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                >
                  Sig ›
                </button>
              </div>
            )}
          </div>

          <div className="pie-modal mt-3" style={{ paddingTop: '15px', borderTop: '1px solid #dee2e6' }}>
            <BotonCancelar onClick={onClose} />
            <BotonAceptar onClick={handleConfirmar} />
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación */}
      {modalConfirmacion && (
        <Modal
          isOpen={modalConfirmacion}
          onClose={() => setModalConfirmacion(false)}
        >
          <div className="encabezado-modal">
            <h3>Confirmar Orden</h3>
          </div>
          <div className="text-center">
            <p>¿Está seguro de que desea confirmar la orden <strong>#{orden?.idOrden}</strong>?</p>
            <p>Total: <strong>${totalOrden.toFixed(2)}</strong></p>
            <p className="text-muted">Esta acción creará los lotes en el inventario y no se puede deshacer.</p>
          </div>
          <div className="pie-modal">
            <BotonCancelar onClick={() => setModalConfirmacion(false)} />
            <BotonAceptar onClick={confirmarOrden} />
          </div>
        </Modal>
      )}

      {/* Modal de error para lotes duplicados o existentes */}
      <Modal isOpen={modalError.visible} onClose={cerrarModalError}>
        <div className="modal-content text-center">
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle mb-2"></i>
            <h5>Error de Validación</h5>
            <p>{modalError.mensaje}</p>
          </div>
          <BotonAceptar onClick={cerrarModalError} />
        </div>
      </Modal>

      {/* Modal de mensajes generales */}
      <Modal
        isOpen={modalMensaje.visible}
        onClose={() => setModalMensaje({ ...modalMensaje, visible: false })}
      >
        <div className="text-center p-3">
          <i
            className={
              modalMensaje.tipo === "exito"
                ? "bi bi-check-circle-fill text-success display-4 mb-2"
                : modalMensaje.tipo === "error"
                ? "bi bi-x-circle-fill text-danger display-4 mb-2"
                : "bi bi-exclamation-triangle-fill text-warning display-4 mb-2"
            }
          ></i>
          <h3>
            {modalMensaje.tipo === "exito"
              ? "¡Éxito!"
              : modalMensaje.tipo === "error"
              ? "Error"
              : "Advertencia"}
          </h3>
          <p>{modalMensaje.mensaje}</p>
        </div>
      </Modal>
    </>
  );
};

export default ModalConfirmarOrden;