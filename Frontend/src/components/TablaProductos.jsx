import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import Modal from "./Modal";
import BotonCancelar from "./BotonCancelar";
import BotonGuardar from "./BotonGuardar";
import BotonEditar from "./BotonEditar";
import BotonEliminar from "./BotonEliminar";
import BotonAceptar from "./BotonAceptar";
import "../styles/tablaProductos.css";
import "bootstrap/dist/css/bootstrap.min.css";

const api = axios.create({
    baseURL: "http://localhost:8080/angora/api/v1",
    headers: { "Content-Type": "application/json" },
});

const TablaProductos = forwardRef(({ registrosMateria, lotesMateriaPrima, setRegistrosMateria, setLotesMateriaPrima, proveedores }, ref) => {
    const [registros, setRegistros] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [modalAbierta, setModalAbierta] = useState(false);
    const [materiasProducto, setMateriasProducto] = useState([]);
    const [modalMateriaAbierta, setModalMateriaAbierta] = useState(false);
    const [materiaNueva, setMateriaNueva] = useState({ idMateria: 0, cantidad: 0 });
    const [modoEdicionMateria, setModoEdicionMateria] = useState(false);
    const [indiceEdicionMateria, setIndiceEdicionMateria] = useState(null);
    const [modalStock, setModalStock] = useState(false);
    const [productoStock, setProductoStock] = useState(null);
    const [lotesUsadosEnProductos, setLotesUsadosEnProductos] = useState([]);
    const [producciones, setProducciones] = useState([]);
    const [produccionesLotes, setProduccionesLotes] = useState([]);
    const [costoTotal, setCostoTotal] = useState(0);
    const [costoModificadoManualmente, setCostoModificadoManualmente] = useState(false);
    const [formularioTemp, setFormularioTemp] = useState({ cantidad: 0, porcentajeGanancia: 15 });
    const [maxFabricable, setMaxFabricable] = useState(null);
    const [modalAdvertenciaPocoStock, setModalAdvertenciaPocoStock] = useState(false);
    const [modalAdvertenciaIdInvalido, setModalAdvertenciaIdInvalido] = useState(false);
    const [modalAdvertenciaMateriaAgregada, setModalAdvertenciaMateriaAgregada] = useState(false);
    const [modalAdvertenciaIdDuplicado, setModalAdvertenciaIdDuplicado] = useState(false);
    const [modalLotesUsados, setModalLotesUsados] = useState(false);
    const [lotesUsadosProducto, setLotesUsadosProducto] = useState([]);
    const [error, setError] = useState(null);

    // Cargar datos iniciales
    useEffect(() => {
        const fetchData = async () => {
            try {

                // Consultas = lotesUsadosRes, produccionesRes, produccionesLotesRes

                const [productosRes] = await Promise.all([
                    api.get("/inventarioProducto"),
                    // api.get("/lotes-usados"),
                    // api.get("/producciones"),
                    // api.get("/producciones-lotes"),
                ]);
                setRegistros(productosRes.data);
                setLotesUsadosEnProductos(lotesUsadosRes.data);
                setProducciones(produccionesRes.data);
                setProduccionesLotes(produccionesLotesRes.data);
                localStorage.setItem("productos", JSON.stringify(productosRes.data));
                localStorage.setItem("lotesUsadosEnProductos", JSON.stringify(lotesUsadosRes.data));
                localStorage.setItem("producciones", JSON.stringify(produccionesRes.data));
                localStorage.setItem("produccionesLotes", JSON.stringify(produccionesLotesRes.data));
            } catch (err) {
                setError(err.response?.data?.message || "Error al conectar con el backend");
                const savedProductos = localStorage.getItem("productos");
                const savedLotesUsados = localStorage.getItem("lotesUsadosEnProductos");
                const savedProducciones = localStorage.getItem("producciones");
                const savedProduccionesLotes = localStorage.getItem("produccionesLotes");
                if (savedProductos) setRegistros(JSON.parse(savedProductos));
                if (savedLotesUsados) setLotesUsadosEnProductos(JSON.parse(savedLotesUsados));
                if (savedProducciones) setProducciones(JSON.parse(savedProducciones));
                if (savedProduccionesLotes) setProduccionesLotes(JSON.parse(savedProduccionesLotes));
            }
        };
        fetchData();
    }, []);

    useImperativeHandle(ref, () => ({
        abrirModalAgregar: () => {
            setProductoSeleccionado(null);
            setMateriasProducto([]);
            setCostoTotal(0);
            setCostoModificadoManualmente(false);
            setFormularioTemp({ cantidad: 0, porcentajeGanancia: 15 });
            setModalAbierta(true);
        },
    }));

    useEffect(() => {
        if (!costoModificadoManualmente) {
            const nuevoCosto = materiasProducto.reduce((acc, mat) => {
                const inv = registrosMateria.find((m) => m.idMateria === mat.idMateria);
                return acc + (inv?.costo || 0) * mat.cantidad;
            }, 0);
            setCostoTotal(nuevoCosto);
            setFormularioTemp((prev) => ({
                ...prev,
                precioUnitario: nuevoCosto * (1 + (prev.porcentajeGanancia || 15) / 100),
            }));
        }
    }, [materiasProducto, costoModificadoManualmente, registrosMateria]);

    const formatDateTime = (dateString) => {
        if (!dateString || dateString === "N/A") return "N/A";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date);
    };

    const abrirModalEditar = (producto) => {
        setProductoSeleccionado(producto);
        setMateriasProducto(producto.materias || []);
        setCostoTotal(producto.costo || 0);
        setCostoModificadoManualmente(true);
        setFormularioTemp({
            idProducto: producto.idProducto,
            nombre: producto.nombre,
            precioUnitario: producto.precioUnitario,
            cantidad: producto.cantidad,
            idCategoria: producto.idCategoria,
            porcentajeGanancia: ((producto.precioUnitario / producto.costo) - 1) * 100,
        });
        setModalAbierta(true);
    };

    const abrirModalStock = (producto) => {
        setProductoStock(producto);
        if (producto?.materias?.length) {
            const cantidadesPosibles = producto.materias.map((mat) => {
                const lotes = lotesMateriaPrima
                    .filter((lote) => lote.idMateria === mat.idMateria && lote.cantidadDisponible > 0)
                    .sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));
                let cantidadNecesaria = mat.cantidad;
                let unidadesPosibles = Infinity;
                for (const lote of lotes) {
                    if (cantidadNecesaria <= 0) break;
                    const disponible = lote.cantidadDisponible;
                    const unidades = Math.floor(disponible / mat.cantidad);
                    unidadesPosibles = Math.min(unidadesPosibles, unidades);
                    cantidadNecesaria -= disponible;
                }
                return cantidadNecesaria <= 0 ? unidadesPosibles : 0;
            });
            setMaxFabricable(Math.min(...cantidadesPosibles));
        } else {
            setMaxFabricable(0);
        }
        setModalStock(true);
    };

    const abrirModalLotesUsados = (producto) => {
        const lotesUsados = lotesUsadosEnProductos
            .filter((lu) => lu.idProducto === producto.idProducto)
            .map((lu) => {
                const lote = lotesMateriaPrima.find((l) => l.idLote === lu.idLote);
                const produccionLote = produccionesLotes.find(
                    (pl) => pl.idLote === lu.idLote && pl.cantidadUsadaDelLote === lu.cantidadUsada
                );
                return {
                    ...lu,
                    materiaNombre: registrosMateria.find((m) => m.idMateria === lote?.idMateria)?.nombre || "N/A",
                    proveedorNombre: lote?.idProveedor
                        ? proveedores.find((p) => p.idProveedor === lote.idProveedor)?.nombre || "N/A"
                        : "Manual",
                    cantidadInicial: lote?.cantidad || 0,
                    cantidadDisponible: lote?.cantidadDisponible || 0,
                    fechaIngreso: formatDateTime(lote?.fechaIngreso),
                    fechaProduccion: formatDateTime(lu.fechaProduccion),
                    idProduccion: produccionLote?.idProduccion || "N/A",
                };
            })
            .sort((a, b) => new Date(a.fechaProduccion) - new Date(b.fechaProduccion));
        setLotesUsadosProducto(lotesUsados);
        setModalLotesUsados(true);
    };

    const eliminarProducto = async (producto) => {
        try {
            await api.delete(`/inventarioProducto/${producto.idProducto}`);
            const nuevosRegistros = registros.filter((p) => p.idProducto !== producto.idProducto);
            setRegistros(nuevosRegistros);
            localStorage.setItem("productos", JSON.stringify(nuevosRegistros));
        } catch (err) {
            setError(err.response?.data?.message || "Error al eliminar el producto");
        }
    };

    const guardarProducto = async (e) => {
        e.preventDefault();
        const idProducto = Number(formularioTemp.idProducto);
        if (!productoSeleccionado && registros.some((p) => p.idProducto === idProducto)) {
            setModalAdvertenciaIdDuplicado(true);
            return;
        }
        const nuevo = {
            idProducto,
            nombre: formularioTemp.nombre,
            costo: Number(costoTotal),
            precioUnitario: Number(formularioTemp.precioUnitario),
            cantidad: Number(formularioTemp.cantidad),
            idCategoria: formularioTemp.idCategoria,
            materias: materiasProducto,
        };

        try {
            if (productoSeleccionado) {
                await api.put(`/inventarioProducto/${idProducto}`, nuevo);
                setRegistros((prev) => prev.map((p) => (p.idProducto === idProducto ? nuevo : p)));
            } else {
                await api.post("/inventarioProducto", nuevo);
                setRegistros((prev) => [...prev, nuevo]);
            }
            localStorage.setItem("productos", JSON.stringify(registros));
            setModalAbierta(false);
            setProductoSeleccionado(null);
            setMateriasProducto([]);
            setCostoTotal(0);
            setCostoModificadoManualmente(false);
            setFormularioTemp({ cantidad: 0, porcentajeGanancia: 15 });
        } catch (err) {
            setError(err.response?.data?.message || "Error al guardar el producto");
        }
    };

    const agregarMateriaAlProducto = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idMateria = Number(materiaNueva.idMateria);
        const cantidad = Number(materiaNueva.cantidad);
        const materia = registrosMateria.find((m) => m.idMateria === idMateria);

        if (!materia) {
            setModalAdvertenciaIdInvalido(true);
            return;
        }
        if (isNaN(cantidad) || cantidad <= 0) {
            setError("Cantidad inválida");
            return;
        }

        const nuevaMateria = { idMateria, nombre: materia.nombre, cantidad };
        const nuevasMaterias = [...materiasProducto];

        if (modoEdicionMateria && indiceEdicionMateria !== null) {
            nuevasMaterias[indiceEdicionMateria] = nuevaMateria;
        } else {
            if (materiasProducto.find((m) => m.idMateria === idMateria)) {
                setModalAdvertenciaMateriaAgregada(true);
                return;
            }
            nuevasMaterias.push(nuevaMateria);
        }

        setMateriasProducto(nuevasMaterias);
        setModoEdicionMateria(false);
        setIndiceEdicionMateria(null);
        setMateriaNueva({ idMateria: 0, cantidad: 0 });
        setModalMateriaAbierta(false);
        setCostoModificadoManually(false);
    };

    const actualizarStock = async (e) => {
        e.preventDefault();
        const nuevaCantidad = parseInt(e.target.stockCantidad?.value, 10);
        if (isNaN(nuevaCantidad) || nuevaCantidad < 0) return setError("Cantidad inválida");

        const diferencia = nuevaCantidad - productoStock.cantidad;

        try {
            if (diferencia > 0) {
                const nuevosLotes = [...lotesMateriaPrima];
                const nuevosRegistrosMateria = [...registrosMateria];
                const nuevosLotesUsados = [...lotesUsadosEnProductos];
                const nuevasProducciones = [...producciones];
                const nuevosProduccionesLotes = [...produccionesLotes];
                const fechaActual = new Date().toISOString();
                const idProduccion = Math.max(...producciones.map((p) => p.idProduccion), 0) + 1;

                const nuevaProduccion = {
                    idProduccion,
                    idProducto: productoStock.idProducto,
                    fecha: fechaActual,
                };
                const prodRes = await api.post("/producciones", nuevaProduccion);
                nuevasProducciones.push(prodRes.data);

                let stockSuficiente = true;

                for (const mat of productoStock.materias) {
                    let cantidadNecesaria = mat.cantidad * diferencia;
                    const lotes = nuevosLotes
                        .filter((lote) => lote.idMateria === mat.idMateria && lote.cantidadDisponible > 0)
                        .sort((a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso));

                    const totalDisponible = lotes.reduce((sum, lote) => sum + lote.cantidadDisponible, 0);
                    if (totalDisponible < cantidadNecesaria) {
                        stockSuficiente = false;
                        break;
                    }

                    for (const lote of lotes) {
                        if (cantidadNecesaria <= 0) break;
                        const disponible = lote.cantidadDisponible;
                        const cantidadUsada = Math.min(disponible, cantidadNecesaria);
                        lote.cantidadDisponible = Math.max(0, disponible - cantidadUsada);
                        cantidadNecesaria -= cantidadUsada;

                        const nuevoLoteUsado = {
                            id: Math.max(...lotesUsadosEnProductos.map((lu) => lu.id), 0) + 1,
                            idLote: lote.idLote,
                            idProducto: productoStock.idProducto,
                            cantidadUsada,
                            fechaProduccion: fechaActual,
                        };
                        const loteUsadoRes = await api.post("/lotes-usados", nuevoLoteUsado);
                        nuevosLotesUsados.push(loteUsadoRes.data);

                        const nuevoProduccionLote = {
                            id: Math.max(...produccionesLotes.map((pl) => pl.id), 0) + 1,
                            idProduccion,
                            idLote: lote.idLote,
                            cantidadUsadaDelLote: cantidadUsada,
                        };
                        const prodLoteRes = await api.post("/producciones-lotes", nuevoProduccionLote);
                        nuevosProduccionesLotes.push(prodLoteRes.data);

                        await api.put(`/lotes/${lote.idLote}`, lote);
                    }

                    const inv = nuevosRegistrosMateria.find((m) => m.idMateria === mat.idMateria);
                    if (inv) {
                        const totalDisponible = nuevosLotes
                            .filter((lote) => lote.idMateria === mat.idMateria)
                            .reduce((sum, lote) => sum + lote.cantidadDisponible, 0);
                        inv.cantidad = totalDisponible;
                        await api.put(`/materias/${inv.idMateria}`, inv);
                    }
                }

                if (!stockSuficiente) {
                    setModalAdvertenciaPocoStock(true);
                    return;
                }

                setLotesUsadosEnProductos(nuevosLotesUsados);
                setProducciones(nuevasProducciones);
                setProduccionesLotes(nuevosProduccionesLotes);
                setLotesMateriaPrima(nuevosLotes);
                setRegistrosMateria(nuevosRegistrosMateria);
                localStorage.setItem("lotesUsadosEnProductos", JSON.stringify(nuevosLotesUsados));
                localStorage.setItem("producciones", JSON.stringify(nuevasProducciones));
                localStorage.setItem("produccionesLotes", JSON.stringify(nuevosProduccionesLotes));
                localStorage.setItem("lotesMateriaPrima", JSON.stringify(nuevosLotes));
                localStorage.setItem("registrosMateria", JSON.stringify(nuevosRegistrosMateria));
            } else if (diferencia < 0) {
                const nuevosLotes = [...lotesMateriaPrima];
                const nuevosRegistrosMateria = [...registrosMateria];
                const nuevosLotesUsados = [...lotesUsadosEnProductos];
                const nuevosProduccionesLotes = [...produccionesLotes];
                const cantidadDevolver = Math.abs(diferencia);

                const ultimaProduccion = producciones
                    .filter((p) => p.idProducto === productoStock.idProducto)
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

                if (ultimaProduccion) {
                    const idProduccion = ultimaProduccion.idProduccion;

                    for (const mat of productoStock.materias) {
                        let cantidadDevolverMat = mat.cantidad * cantidadDevolver;
                        const lotes = nuevosLotes
                            .filter((lote) => lote.idMateria === mat.idMateria)
                            .sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso));

                        for (const lote of lotes) {
                            if (cantidadDevolverMat <= 0) break;
                            const cantidadDevolverLote = Math.min(cantidadDevolverMat, mat.cantidad * cantidadDevolver);
                            lote.cantidadDisponible += cantidadDevolverLote;
                            cantidadDevolverMat -= cantidadDevolverLote;

                            const loteUsado = nuevosLotesUsados.find(
                                (lu) =>
                                    lu.idLote === lote.idLote &&
                                    lu.idProducto === productoStock.idProducto &&
                                    lu.fechaProduccion === ultimaProduccion.fecha
                            );
                            if (loteUsado) {
                                const indexLoteUsado = nuevosLotesUsados.indexOf(loteUsado);
                                if (loteUsado.cantidadUsada <= cantidadDevolverLote) {
                                    await api.delete(`/lotes-usados/${loteUsado.id}`);
                                    nuevosLotesUsados.splice(indexLoteUsado, 1);
                                    const prodLote = nuevosProduccionesLotes.find(
                                        (pl) => pl.idProduccion === idProduccion && pl.idLote === lote.idLote
                                    );
                                    if (prodLote) {
                                        await api.delete(`/producciones-lotes/${prodLote.id}`);
                                        nuevosProduccionesLotes.splice(nuevosProduccionesLotes.indexOf(prodLote), 1);
                                    }
                                } else {
                                    loteUsado.cantidadUsada -= cantidadDevolverLote;
                                    await api.put(`/lotes-usados/${loteUsado.id}`, loteUsado);
                                    const prodLote = nuevosProduccionesLotes.find(
                                        (pl) => pl.idProduccion === idProduccion && pl.idLote === lote.idLote
                                    );
                                    if (prodLote) {
                                        prodLote.cantidadUsadaDelLote -= cantidadDevolverLote;
                                        await api.put(`/producciones-lotes/${prodLote.id}`, prodLote);
                                    }
                                }
                            }
                            await api.put(`/lotes/${lote.idLote}`, lote);
                        }

                        const inv = nuevosRegistrosMateria.find((m) => m.idMateria === mat.idMateria);
                        if (inv) {
                            const totalDisponible = nuevosLotes
                                .filter((lote) => lote.idMateria === mat.idMateria)
                                .reduce((sum, lote) => sum + lote.cantidadDisponible, 0);
                            inv.cantidad = totalDisponible;
                            await api.put(`/materias/${inv.idMateria}`, inv);
                        }
                    }

                    const lotesProduccion = nuevosProduccionesLotes.filter((pl) => pl.idProduccion === idProduccion);
                    if (lotesProduccion.length === 0) {
                        await api.delete(`/producciones/${idProduccion}`);
                        setProducciones((prev) => prev.filter((p) => p.idProduccion !== idProduccion));
                    }
                }

                setLotesUsadosEnProductos(nuevosLotesUsados);
                setProduccionesLotes(nuevosProduccionesLotes);
                setLotesMateriaPrima(nuevosLotes);
                setRegistrosMateria(nuevosRegistrosMateria);
                localStorage.setItem("lotesUsadosEnProductos", JSON.stringify(nuevosLotesUsados));
                localStorage.setItem("produccionesLotes", JSON.stringify(nuevosProduccionesLotes));
                localStorage.setItem("lotesMateriaPrima", JSON.stringify(nuevosLotes));
                localStorage.setItem("registrosMateria", JSON.stringify(nuevosRegistrosMateria));
                localStorage.setItem("producciones", JSON.stringify(producciones));
            }

            const productoActualizado = { ...productoStock, cantidad: nuevaCantidad };
            await api.put(`/inventarioProducto/${productoStock.idProducto}`, productoActualizado);
            setRegistros((prev) =>
                prev.map((p) => (p.idProducto === productoStock.idProducto ? productoActualizado : p))
            );
            localStorage.setItem("productos", JSON.stringify(registros));
            setModalStock(false);
        } catch (err) {
            setError(err.response?.data?.message || "Error al actualizar el stock");
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="container inventario">
            {error && (
                <Modal isOpen={!!error} onClose={() => setError(null)}>
                    <div className="encabezado-modal">
                        <h2>Error</h2>
                    </div>
                    <p className="text-center">{error}</p>
                    <div className="modal-footer">
                        <BotonAceptar onClick={() => setError(null)} />
                    </div>
                </Modal>
            )}
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Costo</th>
                        <th>Precio</th>
                        <th>Cantidad</th>
                        <th>Categoría</th>
                        <th>Opciones</th>
                    </tr>
                </thead>
                <tbody>
                    {registros.map((p) => (
                        <tr key={p.idProducto}>
                            <td>{p.idProducto}</td>
                            <td>{p.nombre}</td>
                            <td>{formatCurrency(p.costo)}</td>
                            <td>{formatCurrency(p.precioUnitario)}</td>
                            <td>{p.cantidad}</td>
                            <td>{p.idCategoria}</td>
                            <td>
                                <BotonEditar onClick={() => abrirModalEditar(p)}>Editar</BotonEditar>
                                <BotonEliminar onClick={() => eliminarProducto(p)}>Eliminar</BotonEliminar>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => abrirModalStock(p)}>Stock</button>
                                <button className="btn btn-sm btn-outline-info" onClick={() => abrirModalLotesUsados(p)}>Lotes Usados</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {modalAbierta && (
                <Modal isOpen={modalAbierta} onClose={() => setModalAbierta(false)}>
                    <form onSubmit={guardarProducto}>
                        <div className="mb-3 text-center">
                            <h4>{productoSeleccionado ? "Editar" : "Agregar"} Producto</h4>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">ID Producto</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formularioTemp.idProducto || ""}
                                min="1"
                                required
                                disabled={productoSeleccionado !== null}
                                onChange={(e) => setFormularioTemp((prev) => ({ ...prev, idProducto: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formularioTemp.nombre || ""}
                                required
                                onChange={(e) => setFormularioTemp((prev) => ({ ...prev, nombre: e.target.value }))}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Costo Unitario (COP)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={costoTotal}
                                min="0"
                                onChange={(e) => {
                                    const value = Number(e.target.value);
                                    setCostoTotal(value);
                                    setCostoModificadoManualmente(true);
                                    setFormularioTemp((prev) => ({
                                        ...prev,
                                        precioUnitario: value * (1 + (prev.porcentajeGanancia || 15) / 100),
                                    }));
                                }}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Porcentaje de Ganancia (%)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formularioTemp.porcentajeGanancia || 15}
                                min="0"
                                required
                                onChange={(e) => {
                                    const porcentaje = Number(e.target.value) || 15;
                                    setFormularioTemp((prev) => ({
                                        ...prev,
                                        porcentajeGanancia: porcentaje,
                                        precioUnitario: costoTotal * (1 + porcentaje / 100),
                                    }));
                                }}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Precio Unitario (COP)</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formularioTemp.precioUnitario || 0}
                                min="0"
                                required
                                onChange={(e) => setFormularioTemp((prev) => ({ ...prev, precioUnitario: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Cantidad</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formularioTemp.cantidad || 0}
                                min="0"
                                required
                                disabled
                                onChange={(e) => setFormularioTemp((prev) => ({ ...prev, cantidad: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Categoría</label>
                            <select
                                className="form-select"
                                required
                                value={formularioTemp.idCategoria || ""}
                                onChange={(e) => setFormularioTemp((prev) => ({ ...prev, idCategoria: e.target.value }))}
                            >
                                <option value="">Selecciona una categoría</option>
                                <option value="Jabón">Jabón</option>
                                <option value="Desengrasante">Desengrasante</option>
                                <option value="Insumo">Insumo</option>
                                <option value="Embalaje">Embalaje</option>
                            </select>
                        </div>
                        <h6 className="text-center">Materias Primas</h6>
                        <table className="table table-sm table-bordered">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Cantidad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materiasProducto.map((m, i) => (
                                    <tr key={i}>
                                        <td>{m.idMateria}</td>
                                        <td>{m.nombre}</td>
                                        <td>{m.cantidad}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary me-1"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setModoEdicionMateria(true);
                                                    setIndiceEdicionMateria(i);
                                                    setMateriaNueva({ idMateria: m.idMateria, cantidad: m.cantidad });
                                                    setModalMateriaAbierta(true);
                                                }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const copia = [...materiasProducto];
                                                    copia.splice(i, 1);
                                                    setMateriasProducto(copia);
                                                    setCostoModificadoManually(false);
                                                }}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button
                            type="button"
                            className="btn btn-success mt-2"
                            onClick={() => {
                                setModoEdicionMateria(false);
                                setMateriaNueva({ idMateria: 0, cantidad: 0 });
                                setModalMateriaAbierta(true);
                            }}
                        >
                            Agregar Materia Prima
                        </button>
                        <div className="d-flex justify-content-end mt-3">
                            <BotonCancelar onClick={() => setModalAbierta(false)} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}
            {modalMateriaAbierta && (
                <Modal isOpen={modalMateriaAbierta} onClose={() => setModalMateriaAbierta(false)}>
                    <form onSubmit={agregarMateriaAlProducto}>
                        <h5 className="text-center">{modoEdicionMateria ? "Editar" : "Agregar"} Materia Prima</h5>
                        <div className="mb-3">
                            <label className="form-label">ID Materia</label>
                            <input
                                type="number"
                                className="form-control"
                                value={materiaNueva.idMateria}
                                required
                                disabled={modoEdicionMateria}
                                onChange={(e) => setMateriaNueva({ ...materiaNueva, idMateria: Number(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Cantidad Requerida</label>
                            <input
                                type="number"
                                className="form-control"
                                value={materiaNueva.cantidad || ""}
                                min="1"
                                required
                                onChange={(e) =>
                                    setMateriaNueva({
                                        ...materiaNueva,
                                        cantidad: e.target.value === "" ? 0 : Number(e.target.value),
                                    })
                                }
                            />
                        </div>
                        <div className="d-flex justify-content-end">
                            <BotonCancelar onClick={() => setModalMateriaAbierta(false)} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}
            {modalStock && (
                <Modal isOpen={modalStock} onClose={() => setModalStock(false)}>
                    <form onSubmit={actualizarStock}>
                        <h5 className="text-center">Cambiar cantidad de stock de {productoStock?.nombre}</h5>
                        {maxFabricable !== null && (
                            <div className="alert alert-info">
                                Puedes fabricar hasta <strong>{maxFabricable}</strong> unidades con el inventario actual.
                            </div>
                        )}
                        <div className="alert alert-primary">
                            Cantidad actual es <strong>{productoStock?.cantidad}</strong> unidades.
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Nueva cantidad deseada</label>
                            <input
                                name="stockCantidad"
                                type="number"
                                required
                                className="form-control"
                                min="0"
                            />
                        </div>
                        <div className="d-flex justify-content-end">
                            <BotonCancelar onClick={() => setModalStock(false)} />
                            <BotonGuardar type="submit" />
                        </div>
                    </form>
                </Modal>
            )}
            {modalAdvertenciaPocoStock && (
                <Modal isOpen={modalAdvertenciaPocoStock} onClose={() => setModalAdvertenciaPocoStock(false)}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p className="text-center">¡Materia prima <strong>Insuficiente</strong> para aumentar el stock!</p>
                    <div className="modal-footer">
                        <BotonAceptar onClick={() => setModalAdvertenciaPocoStock(false)} />
                    </div>
                </Modal>
            )}
            {modalAdvertenciaIdInvalido && (
                <Modal isOpen={modalAdvertenciaIdInvalido} onClose={() => setModalAdvertenciaIdInvalido(false)}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p className="text-center">
                        ¡No existe ninguna Materia prima con el ID <strong>{materiaNueva.idMateria}</strong>!
                    </p>
                    <div className="modal-footer">
                        <BotonAceptar onClick={() => setModalAdvertenciaIdInvalido(false)} />
                    </div>
                </Modal>
            )}
            {modalAdvertenciaMateriaAgregada && (
                <Modal isOpen={modalAdvertenciaMateriaAgregada} onClose={() => setModalAdvertenciaMateriaAgregada(false)}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p className="text-center">
                        ¡La materia prima con el ID <strong>{materiaNueva.idMateria}</strong> ya está agregada!
                    </p>
                    <div className="modal-footer">
                        <BotonAceptar onClick={() => setModalAdvertenciaMateriaAgregada(false)} />
                    </div>
                </Modal>
            )}
            {modalAdvertenciaIdDuplicado && (
                <Modal isOpen={modalAdvertenciaIdDuplicado} onClose={() => setModalAdvertenciaIdDuplicado(false)}>
                    <div className="encabezado-modal">
                        <h2>Advertencia</h2>
                    </div>
                    <p className="text-center">
                        ¡Ya existe un producto con el ID <strong>{formularioTemp.idProducto}</strong>!
                    </p>
                    <div className="modal-footer">
                        <BotonAceptar onClick={() => setModalAdvertenciaIdDuplicado(false)} />
                    </div>
                </Modal>
            )}
            {modalLotesUsados && (
                <Modal isOpen={modalLotesUsados} onClose={() => setModalLotesUsados(false)}>
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            className="btn-close"
                            style={{ position: 'absolute', top: '10px', right: '10px' }}
                            onClick={() => setModalLotesUsados(false)}
                            aria-label="Close"
                        ></button>
                        <h2 className="mb-3">Lotes Usados en Producto</h2>
                        <div className="row g-3">
                            {lotesUsadosProducto.map((lu) => (
                                <div key={lu.id} className="col-md-12">
                                    <div className="card shadow-sm h-100">
                                        <div className="card-body">
                                            <h5 className="card-title">Lote #{lu.idLote}</h5>
                                            <p className="card-text">
                                                <strong>Materia Prima:</strong> {lu.materiaNombre}<br />
                                                <strong>Cantidad Inicial:</strong> {lu.cantidadInicial} unidades<br />
                                                <strong>Cantidad Disponible:</strong> {lu.cantidadDisponible} unidades<br />
                                                <strong>Cantidad Usada:</strong> {lu.cantidadUsada} unidades<br />
                                                <strong>ID Producción:</strong> {lu.idProduccion}<br />
                                                <strong>Fecha Ingreso:</strong> {lu.fechaIngreso}<br />
                                                <strong>Fecha Producción:</strong> {lu.fechaProduccion}<br />
                                                <strong>Proveedor:</strong> {lu.proveedorNombre}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer mt-4">
                            <BotonAceptar onClick={() => setModalLotesUsados(false)} />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
});

export default TablaProductos;