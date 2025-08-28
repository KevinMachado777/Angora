import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import Modal from "./Modal";
import BotonCancelar from "./BotonCancelar";
import BotonGuardar from "./BotonGuardar";
import BotonEditar from "./BotonEditar";
import BotonAceptar from "./BotonAceptar";
import "../styles/tablaProductos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "../api/axiosInstance";

const TablaProductos = forwardRef(
  (
    {
      registrosMateria,
      lotesMateriaPrima,
      setRegistrosMateria,
      setLotesMateriaPrima,
      proveedores,
      token,
    },
    ref
  ) => {
    const [registros, setRegistros] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [modalAbierta, setModalAbierta] = useState(false);
    const [materiasProducto, setMateriasProducto] = useState([]);
    const [modalMateriaAbierta, setModalMateriaAbierta] = useState(false);
    const [materiaNueva, setMateriaNueva] = useState({
      idMateria: "",
      cantidad: 0,
    });
    const [modoEdicionMateria, setModoEdicionMateria] = useState(false);
    const [indiceEdicionMateria, setIndiceEdicionMateria] = useState(null);
    const [modalStock, setModalStock] = useState(false);
    const [productoStock, setProductoStock] = useState(null);
    const [maxFabricable, setMaxFabricable] = useState(null);
    const [nuevaCantidad, setNuevaCantidad] = useState(0);
    const [disminuirChecked, setDisminuirChecked] = useState(false);
    const [cantidadDisminuir, setCantidadDisminuir] = useState(0);
    const [notasStock, setNotasStock] = useState(""); // New state for notes
    const [modalConfirmDecrease, setModalConfirmDecrease] = useState(false);
    const [lotesUsadosEnProductos, setLotesUsadosEnProductos] = useState([]);
    const [producciones, setProducciones] = useState([]);
    const [produccionesLotes, setProduccionesLotes] = useState([]);
    const [costoTotal, setCostoTotal] = useState(0);
    const [esProductoFabricado, setEsProductoFabricado] = useState(true);
    const [formularioTemp, setFormularioTemp] = useState({
      idProducto: "",
      porcentajeGanancia: 1,
      nombre: "",
      idCategoria: "",
      iva: null,
      precioDetal: 0,
      precioMayorista: null,
      stockMinimo: null,
      stockMaximo: null,
      costo: 0,
    });
    const [precioDetalInput, setPrecioDetalInput] = useState(0);
    const [precioMayoristaInput, setPrecioMayoristaInput] = useState("");
    const [precioDetalModificadoManually, setPrecioDetalModificadoManually] =
      useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [categorias, setCategorias] = useState([]);
    const [modalCategoriaAbierta, setModalCategoriaAbierta] = useState(false);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [nuevaCategoria, setNuevaCategoria] = useState({
      idCategoria: 0,
      nombre: "",
    });
    const [modoEdicionCategoria, setModoEdicionCategoria] = useState(false);
    const [modalConfirmDeleteCategoria, setModalConfirmDeleteCategoria] =
      useState(false);
    const [categoriaToDelete, setCategoriaToDelete] = useState(null);
    const [productosAsociadosToDelete, setProductosAsociadosToDelete] =
      useState([]);
    const [currentPageCategorias, setCurrentPageCategorias] = useState(1);
    const [itemsPerPageCategorias] = useState(5);
    const [currentPageLotes, setCurrentPageLotes] = useState(1);
    const [itemsPerPageLotes] = useState(2);
    const [filterDate, setFilterDate] = useState("");
    const [modalLotesUsados, setModalLotesUsados] = useState(false);
    const [productoLotesSeleccionado, setProductoLotesSeleccionado] =
      useState(null);
    const [lotesUsadosProducto, setLotesUsadosProducto] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalAdvertenciaPocoStock, setModalAdvertenciaPocoStock] =
      useState(false);
    const [modalAdvertenciaIdInvalido, setModalAdvertenciaIdInvalido] =
      useState(false);
    const [
      modalAdvertenciaMateriaAgregada,
      setModalAdvertenciaMateriaAgregada,
    ] = useState(false);
    const [modalAdvertenciaIdDuplicado, setModalAdvertenciaIdDuplicado] =
      useState(false);
    const [modalErrorStockInsuficiente, setModalErrorStockInsuficiente] =
      useState(false);

    // Headers de autenticación
    const authHeaders = () => ({
      Authorization: `Bearer ${localStorage.getItem("accessToken") || token}`,
    });

    // Manejo de errores de API
    const handleApiError = (err, context) => {
      console.error(`Error en ${context}:`, {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      if (err?.response?.status === 401) {
        setError(
          "Sesión expirada o permisos insuficientes. Por favor, inicia sesión nuevamente."
        );
        localStorage.removeItem("accessToken");
        setTimeout(() => (window.location.href = "/login"), 800);
      } else {
        setError(
          err?.response?.data || `Error en ${context}. Intenta de nuevo.`
        );
      }
    };

    // Cargar datos frescos del backend
    const cargarDatosFromBackend = async () => {
      if (!token) return;
      try {
        const headers = authHeaders();

        // Cargar productos
        const productosRes = await api.get("/inventarioProducto", { headers });
        setRegistros(productosRes.data || []);

        // Cargar inventario materia
        try {
          const inventarioMateriaRes = await api.get("/inventarioMateria", {
            headers,
          });
          if (typeof setRegistrosMateria === "function") {
            setRegistrosMateria(inventarioMateriaRes.data);
          }
        } catch (err) {
          console.warn(
            "No se pudo cargar /inventarioMateria:",
            err.message || err
          );
        }

        // Cargar otros datos
        const [
          lotesRes,
          lotesUsadosRes,
          produccionesRes,
          produccionesLotesRes,
          categoriasRes,
        ] = await Promise.all([
          api.get("/lotes", { headers }).catch(() => ({ data: [] })),
          api.get("/lotes-usados", { headers }).catch(() => ({ data: [] })),
          api.get("/producciones", { headers }).catch(() => ({ data: [] })),
          api
            .get("/producciones-lotes", { headers })
            .catch(() => ({ data: [] })),
          api.get("/categorias", { headers }).catch(() => ({ data: [] })),
        ]);

        if (typeof setLotesMateriaPrima === "function") {
          setLotesMateriaPrima(lotesRes.data);
        }
        setLotesUsadosEnProductos(lotesUsadosRes.data);
        setProducciones(produccionesRes.data);
        setProduccionesLotes(produccionesLotesRes.data);
        setCategorias(categoriasRes.data);
      } catch (err) {
        handleApiError(err, "carga de datos de productos");
      }
    };

    // Carga inicial
    useEffect(() => {
      const fetchData = async () => {
        if (!token) {
          setError(
            "No se encontró un token de autenticación. Por favor, inicia sesión."
          );
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        await cargarDatosFromBackend();
        setIsLoading(false);
      };
      fetchData();
    }, [token]);

    // Helpers de costos y lotes
    const getLoteCosto = (lote) => {
      if (!lote) return 0;
      return (
        lote.costoUnitario ??
        lote.costo ??
        lote.precioUnitario ??
        lote.precio ??
        lote.valorUnitario ??
        0
      );
    };

    // Recalculo en tiempo real para el costo
    useEffect(() => {
      if (!esProductoFabricado) {
        setCostoTotal(formularioTemp.costo);
        return;
      }
      const nuevoCostoRaw = (materiasProducto || []).reduce((acc, mp) => {
        const idM = mp.idMateria;
        let costoUnit = 0;
        const rm = (registrosMateria || []).find((r) => r.idMateria === idM);
        if (rm && typeof rm.costo === "number") {
          costoUnit = Number(rm.costo);
        } else {
          const lotes = (lotesMateriaPrima || []).filter(
            (l) =>
              l.idMateria === idM && (l.cantidadDisponible ?? l.cantidad) > 0
          );
          if (lotes && lotes.length > 0) {
            costoUnit = Number(getLoteCosto(lotes[0]) || 0);
          }
        }
        return acc + costoUnit * (mp.cantidad || 0);
      }, 0);

      const nuevoCostoRedondeado = Math.round(nuevoCostoRaw);
      setCostoTotal(nuevoCostoRedondeado);
      if (nuevoCostoRaw > 0) {
        if (!precioDetalModificadoManually) {
          const porcentajeUsado = Math.max(1, Math.min(100, Math.floor(Number(formularioTemp.porcentajeGanancia) || 1)));
          const precioCalc = Number(
            (nuevoCostoRedondeado * (1 + porcentajeUsado / 100)).toFixed(2)
          );
          setPrecioDetalInput(precioCalc);
          setFormularioTemp((prev) => ({ ...prev, precioDetal: precioCalc }));
        }
      }
    }, [
      materiasProducto,
      registrosMateria,
      lotesMateriaPrima,
      precioDetalModificadoManually,
      formularioTemp.porcentajeGanancia,
      esProductoFabricado,
      formularioTemp.costo,
    ]);

    // Recalcular precioDetal cuando cambia porcentaje
    useEffect(() => {
      if (precioDetalModificadoManually) return;
      const costo = Number(costoTotal || 0);

      // Manejar el caso cuando porcentajeGanancia está vacío temporalmente
      const porcentaje = formularioTemp.porcentajeGanancia === '' ? 1 :
        Math.max(1, Math.min(100, Math.floor(Number(formularioTemp.porcentajeGanancia) || 1)));

      const nuevoPrecio = Number((costo * (1 + porcentaje / 100)).toFixed(2));
      setPrecioDetalInput(nuevoPrecio);
      setFormularioTemp((prev) => ({ ...prev, precioDetal: nuevoPrecio }));
    }, [
      formularioTemp.porcentajeGanancia,
      costoTotal,
      precioDetalModificadoManually,
    ]);

    // Exponer abrirModalAgregar a padre
    useImperativeHandle(ref, () => ({
      abrirModalAgregar: async () => {
        await cargarDatosFromBackend();
        setProductoSeleccionado(null);
        setMateriasProducto([]);
        setCostoTotal(0);
        setEsProductoFabricado(true);
        setFormularioTemp({
          idProducto: "",
          porcentajeGanancia: 1,
          nombre: "",
          idCategoria: "",
          iva: null,
          precioDetal: 0,
          precioMayorista: null,
          stockMinimo: null,
          stockMaximo: null,
          costo: 0,
        });
        setPrecioDetalInput(0);
        setPrecioMayoristaInput("");
        setPrecioDetalModificadoManually(false);
        setModalAbierta(true);
      },
    }));

    // Formateadores
    const formatDateTime = (dateString) => {
      if (!dateString || dateString === "N/A") return "N/A";
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    };

    const formatCurrency = (value) => {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 2,
      }).format(value || 0);
    };

    // Abrir modal editar producto
    const abrirModalEditar = async (producto) => {
      await cargarDatosFromBackend();
      setProductoSeleccionado(producto);
      setMateriasProducto(producto.materias || []);
      setCostoTotal(producto.costo || 0);
      setEsProductoFabricado(producto.materias && producto.materias.length > 0);
      const precioDetalVal = Number(producto.precioDetal || 0);
      const precioMayoristaVal =
        producto.precioMayorista != null
          ? Number(producto.precioMayorista)
          : "";
      const porcentajeFinal = Math.max(1, Math.min(100, Math.floor(Number(producto.porcentajeGanancia) || 1)));

      setFormularioTemp({
        idProducto: producto.idProducto,
        nombre: producto.nombre,
        precioDetal: precioDetalVal,
        precioMayorista: precioMayoristaVal,
        porcentajeGanancia: porcentajeFinal,
        idCategoria: producto.idCategoria?.idCategoria || "",
        iva:
          producto.iva === undefined || producto.iva === null
            ? false
            : Boolean(producto.iva),
        stockMinimo:
          producto.stockMinimo != null ? Number(producto.stockMinimo) : null,
        stockMaximo:
          producto.stockMaximo != null ? Number(producto.stockMaximo) : null,
        costo: producto.costo || 0,
      });
      setPrecioDetalInput(precioDetalVal);
      setPrecioMayoristaInput(precioMayoristaVal);
      setPrecioDetalModificadoManually(false);
      setModalAbierta(true);
    };

    // Abrir modal stock
    const abrirModalStock = async (producto) => {
      await cargarDatosFromBackend();
      setProductoStock(producto);
      setDisminuirChecked(false);
      setCantidadDisminuir(0);
      setNuevaCantidad(0);
      setNotasStock("");
      const isManufactured = producto?.materias?.length > 0;
      setEsProductoFabricado(isManufactured);
      let max = 0;
      if (producto?.materias?.length && lotesMateriaPrima?.length) {
        const cantidadesPosibles = producto.materias.map((mat) => {
          const lotes = (lotesMateriaPrima || [])
            .filter(
              (lote) =>
                lote.idMateria === mat.idMateria &&
                (lote.cantidadDisponible ?? lote.cantidad ?? 0) > 0
            )
            .sort(
              (a, b) => new Date(a.fechaIngreso) - new Date(b.fechaIngreso)
            );
          let totalDisponible = 0;
          for (const lote of lotes) {
            totalDisponible += Number(
              lote.cantidadDisponible ?? lote.cantidad ?? 0
            );
          }
          return totalDisponible > 0
            ? Math.floor(totalDisponible / Number(mat.cantidad || 1))
            : 0;
        });
        max = Math.min(...cantidadesPosibles);
      }
      setMaxFabricable(max);
      setModalStock(true);
    };

    // Abrir modal lotes usados
    const abrirModalLotesUsados = async (producto) => {
      await cargarDatosFromBackend();
      setProductoLotesSeleccionado(producto);
      setCurrentPageLotes(1);
      setFilterDate(""); // Reset filter date
      setModalLotesUsados(true);
    };

    // Resolver ID de producción para lote usado
    const resolveIdProduccionForLu = (lu) => {
      if (lu.idProduccion !== undefined && lu.idProduccion !== null) {
        return lu.idProduccion;
      }
      if (producciones && producciones.length > 0 && lu.fechaProduccion) {
        try {
          const fechaLu = new Date(lu.fechaProduccion).getTime();
          const candidate = producciones.find((p) => {
            if (Number(p.idProducto) !== Number(lu.idProducto)) return false;
            const fp = p.fechaProduccion ?? p.fecha ?? p.createdAt ?? null;
            if (!fp) return false;
            const diff = Math.abs(new Date(fp).getTime() - fechaLu);
            return diff <= 120000; // 2 minutos
          });
          if (candidate)
            return (
              candidate.idProduccion ??
              candidate.id ??
              candidate.id_produccion ??
              "N/A"
            );
        } catch {
          // ignore
        }
      }
      if (produccionesLotes && produccionesLotes.length > 0) {
        const qtyLu = Number(lu.cantidadUsada ?? lu.cantidad ?? 0);
        const fechaLu = lu.fechaProduccion
          ? new Date(lu.fechaProduccion).getTime()
          : null;
        let candidate = produccionesLotes.find(
          (pl) =>
            Number(pl.idLote) === Number(lu.idLote) &&
            Math.abs(
              Number(pl.cantidadUsadaDelLote ?? pl.cantidadUsada ?? 0) - qtyLu
            ) < 1e-6
        );
        if (!candidate && fechaLu) {
          candidate = produccionesLotes.find((pl) => {
            if (Number(pl.idLote) !== Number(lu.idLote)) return false;
            const fp = pl.fechaProduccion ?? pl.fecha ?? null;
            if (!fp) return false;
            const diff = Math.abs(new Date(fp).getTime() - fechaLu);
            return diff <= 120000;
          });
        }
        if (candidate)
          return (
            candidate?.idProduccion ??
            candidate?.id_produccion ??
            candidate?.id ??
            "N/A"
          );
      }
      return "N/A";
    };

    useEffect(() => {
      if (!modalLotesUsados || !productoLotesSeleccionado) {
        setLotesUsadosProducto([]);
        return;
      }
      const lotesUsadosParaProducto = (lotesUsadosEnProductos || []).filter(
        (lu) => lu.idProducto === productoLotesSeleccionado.idProducto
      );
      const mapped = lotesUsadosParaProducto.map((lu) => {
        const lote =
          (lotesMateriaPrima || []).find((l) => l.idLote === lu.idLote) || {};
        const fechaProduccionRaw = lu.fechaProduccion;
        const fechaIngresoRaw = lote.fechaIngreso;
        const fechaProduccion = formatDateTime(fechaProduccionRaw);
        const fechaIngreso = formatDateTime(fechaIngresoRaw);
        const cantidadInicial = lote.cantidad ?? 0;
        const usedUntilThis = lotesUsadosEnProductos
          .filter(
            (x) =>
              x.idLote === lu.idLote &&
              new Date(x.fechaProduccion) <= new Date(fechaProduccionRaw)
          )
          .reduce((s, x) => s + (x.cantidadUsada ?? 0), 0);
        const cantidadAntesFabricacion =
          cantidadInicial - (usedUntilThis - (lu.cantidadUsada ?? 0));
        const cantidadUsada = lu.cantidadUsada ?? 0;
        const cantidadDespuesFabricacion =
          cantidadAntesFabricacion - cantidadUsada;

        const proveedorNombre = lote.idProveedor
          ? (proveedores || []).find((p) => p.idProveedor === lote.idProveedor)
            ?.nombre || "N/A"
          : "Manual";
        const idProduccionResolved = resolveIdProduccionForLu(lu);
        // Obtener notas desde la entidad produccion usando idProduccion
        const produccion = (producciones || []).find(
          (p) => String(p.idProduccion) === String(idProduccionResolved)
        );
        const notas = produccion?.notas ? String(produccion.notas) : "N/A";
        return {
          id: lu.id,
          idLote: lu.idLote,
          materiaNombre:
            (registrosMateria || []).find(
              (m) => m.idMateria === lote?.idMateria
            )?.nombre || "N/A",
          proveedorNombre,
          cantidadInicial,
          cantidadAntesFabricacion,
          cantidadUsada,
          cantidadDespuesFabricacion,
          fechaIngreso,
          fechaProduccion,
          fechaIngresoRaw,
          fechaProduccionRaw,
          idProduccion: idProduccionResolved,
          cantidadDisponibleActual: lote?.cantidadDisponible ?? 0,
          notas, // Usar notas de la entidad produccion
        };
      });
      const filtered = mapped.filter((lu) => {
        if (!filterDate) return true;
        if (!lu.fechaProduccionRaw) return false;
        const d = new Date(lu.fechaProduccionRaw);
        if (isNaN(d.getTime())) return false;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const localDate = `${y}-${m}-${day}`;
        return localDate === filterDate;
      });
      // Group by idProduccion
      const groupedByProduccion = filtered.reduce((acc, lu) => {
        const prodId = lu.idProduccion;
        if (!acc[prodId]) {
          acc[prodId] = [];
        }
        acc[prodId].push(lu);
        return acc;
      }, {});
      // Convert to array and sort by idProduccion
      const sortedProducciones = Object.keys(groupedByProduccion)
        .sort((a, b) => {
          if (a === "N/A") return 1;
          if (b === "N/A") return -1;
          return Number(a) - Number(b);
        })
        .map((prodId) => ({
          idProduccion: prodId,
          lotes: groupedByProduccion[prodId].sort(
            (a, b) =>
              new Date(a.fechaProduccionRaw) - new Date(b.fechaProduccionRaw)
          ),
        }));

      setLotesUsadosProducto(sortedProducciones);
      setCurrentPageLotes(1);
    }, [
      modalLotesUsados,
      productoLotesSeleccionado,
      filterDate,
      lotesUsadosEnProductos,
      lotesMateriaPrima,
      produccionesLotes,
      registrosMateria,
      proveedores,
      producciones,
    ]);

    // Abrir modal categoria
    const abrirModalCategoria = (categoria = null) => {
      setCategoriaSeleccionada(categoria);
      setModoEdicionCategoria(!!categoria);
      setNuevaCategoria(
        categoria
          ? { idCategoria: categoria.idCategoria, nombre: categoria.nombre }
          : { idCategoria: 0, nombre: "" }
      );
      setModalCategoriaAbierta(true);
    };

    // Manejar cambio de nombre
    const manejarCambioNombre = (evento, setState, stateKey) => {
      const nuevoValor = evento.target.value.replace(
        /[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s-_]/g,
        ""
      );
      setState((prev) => ({ ...prev, [stateKey]: nuevoValor }));
    };

    // Guardar categoria
    const guardarCategoria = async (e) => {
      e.preventDefault();
      if (!token) {
        setError(
          "No se encontró un token de autenticación. Por favor, inicia sesión."
        );
        return;
      }
      if (!nuevaCategoria.nombre.trim()) {
        setError("El nombre de la categoría no puede estar vacío.");
        return;
      }
      if (
        nuevaCategoria.nombre.length < 3 ||
        !/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s-_]+$/.test(nuevaCategoria.nombre)
      ) {
        setError(
          "El nombre de la categoría debe tener al menos 3 caracteres y solo letras, números, espacios, guiones o guiones bajos."
        );
        return;
      }
      try {
        const headers = authHeaders();
        if (modoEdicionCategoria) {
          await api.put(
            `/categorias/${nuevaCategoria.idCategoria}`,
            { nombre: nuevaCategoria.nombre },
            { headers }
          );
          setCategorias((prev) =>
            prev.map((c) =>
              c.idCategoria === nuevaCategoria.idCategoria
                ? { ...c, nombre: nuevaCategoria.nombre }
                : c
            )
          );
        } else {
          const response = await api.post(
            "/categorias",
            { nombre: nuevaCategoria.nombre },
            { headers }
          );
          setCategorias((prev) => [...prev, response.data]);
        }
        setModalCategoriaAbierta(false);
        setNuevaCategoria({ idCategoria: 0, nombre: "" });
      } catch (err) {
        handleApiError(err, "gestión de categoría");
      }
    };

    // Eliminar categoria
    const eliminarCategoria = async (
      idCategoria,
      options = { force: false }
    ) => {
      const asociados = registros.filter(
        (p) => p.idCategoria?.idCategoria === idCategoria
      );
      if (!options.force && asociados.length > 0) {
        setCategoriaToDelete(idCategoria);
        setProductosAsociadosToDelete(asociados);
        setModalConfirmDeleteCategoria(true);
        return;
      }
      if (!token) {
        setError(
          "No se encontró un token de autenticación. Por favor, inicia sesión."
        );
        return;
      }
      try {
        const headers = authHeaders();
        if (asociados.length > 0 && options.force) {
          await Promise.all(
            asociados.map((p) => {
              const body = {
                idProducto: p.idProducto,
                nombre: p.nombre,
                costo: Number(p.costo) || 0,
                precioDetal: Number(p.precioDetal) || 0,
                precioMayorista:
                  p.precioMayorista != null ? Number(p.precioMayorista) : null,
                stock: Number(p.stock) || 0,
                iva: p.iva ?? false,
                porcentajeGanancia: Math.max(
                  1,
                  Math.floor(Number(p.porcentajeGanancia) || 1)
                ),
                idCategoria: null,
                materias: p.materias ?? [],
                stockMinimo:
                  p.stockMinimo != null ? Number(p.stockMinimo) : null,
                stockMaximo:
                  p.stockMaximo != null ? Number(p.stockMaximo) : null,
              };
              return api.put("/inventarioProducto/", body);
            })
          );
        }
        await api.delete(`/categorias/${idCategoria}`, { headers });
        await cargarDatosFromBackend();
        setModalConfirmDeleteCategoria(false);
        setCategoriaToDelete(null);
        setProductosAsociadosToDelete([]);
      } catch (err) {
        handleApiError(err, "eliminación de categoría");
      }
    };

    // Guardar producto (crear/editar)
    const guardarProducto = async (e) => {
      e.preventDefault();
      if (!token) {
        setError(
          "No se encontró un token de autenticación. Por favor, inicia sesión."
        );
        return;
      }
      if (
        esProductoFabricado &&
        (!materiasProducto || materiasProducto.length === 0)
      ) {
        setError(
          "El producto fabricado debe tener al menos 1 materia prima asociada."
        );
        return;
      }
      if (!productoSeleccionado && !formularioTemp.idProducto.trim()) {
        setError("El ID del producto no puede estar vacío.");
        return;
      }
      if (
        !productoSeleccionado &&
        registros.find((p) => p.idProducto === formularioTemp.idProducto)
      ) {
        setModalAdvertenciaIdDuplicado(true);
        return;
      }
      if (!formularioTemp.nombre.trim()) {
        setError("El nombre del producto no puede estar vacío.");
        return;
      }
      if (
        formularioTemp.nombre.length < 3 ||
        !/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s-_]+$/.test(formularioTemp.nombre)
      ) {
        setError(
          "El nombre debe tener al menos 3 caracteres y solo letras, números, espacios, guiones o guiones bajos."
        );
        return;
      }
      if (
        !productoSeleccionado &&
        (formularioTemp.iva === null || formularioTemp.iva === undefined)
      ) {
        setError("Debes seleccionar si el producto tiene IVA (Sí/No).");
        return;
      }
      if (
        esProductoFabricado &&
        (!materiasProducto || materiasProducto.length === 0)
      ) {
        setError(
          "El producto fabricado debe tener al menos 1 materia prima asociada."
        );
        return;
      }
      if (formularioTemp.precioDetal <= 0) {
        setError("El precio detal debe ser mayor que 0.");
        return;
      }
      const costoRedondeado = esProductoFabricado
        ? Math.round(Number(costoTotal || 0))
        : Math.round(Number(formularioTemp.costo || 0));
      const precioDetalRedondeado = Number(
        Number(formularioTemp.precioDetal || 0).toFixed(2)
      );
      const precioMayorista =
        formularioTemp.precioMayorista != null
          ? Number(Number(formularioTemp.precioMayorista).toFixed(2))
          : null;
      const porcentajeUsado = Math.max(
        1,
        Math.floor(Number(formularioTemp.porcentajeGanancia) || 1)
      );
      try {
        const headers = authHeaders();
        const idProducto = formularioTemp.idProducto.trim();
        if (!idProducto || !/^[a-zA-Z0-9-_]+$/.test(idProducto)) {
          setError(
            "El ID del producto debe contener solo letras, números, guiones o guiones bajos."
          );
          return;
        }
        const payload = {
          idProducto: idProducto,
          nombre: formularioTemp.nombre,
          costo: costoRedondeado,
          precioDetal: precioDetalRedondeado,
          precioMayorista: precioMayorista,
          stock: Number(productoSeleccionado?.stock || 0),
          iva: Boolean(formularioTemp.iva),
          porcentajeGanancia: porcentajeUsado,
          materias: esProductoFabricado
            ? materiasProducto.map((m) => ({
              idMateria: m.idMateria,
              cantidad: Number(m.cantidad),
            }))
            : [],
          idCategoria: formularioTemp.idCategoria
            ? { idCategoria: Number(formularioTemp.idCategoria) }
            : null,
          stockMinimo:
            formularioTemp.stockMinimo != null
              ? Math.floor(Number(formularioTemp.stockMinimo))
              : null,
          stockMaximo:
            formularioTemp.stockMaximo != null
              ? Math.floor(Number(formularioTemp.stockMaximo))
              : null,
        };
        if (productoSeleccionado) {
          if (idProducto !== productoSeleccionado.idProducto) {
            setError("El ID del producto no puede cambiar durante la edición.");
            return;
          }
          await api.put(`/inventarioProducto/${idProducto}`, payload, {
            headers,
          });
        } else {
          await api.post("/inventarioProducto", payload, { headers });
        }
        await cargarDatosFromBackend();
        setModalAbierta(false);
        setProductoSeleccionado(null);
        setMateriasProducto([]);
        setCostoTotal(0);
        setEsProductoFabricado(true);
        setFormularioTemp({
          idProducto: "",
          porcentajeGanancia: 1,
          nombre: "",
          idCategoria: "",
          iva: null,
          precioDetal: 0,
          precioMayorista: null,
          stockMinimo: null,
          stockMaximo: null,
          costo: 0,
        });
        setPrecioDetalInput(0);
        setPrecioMayoristaInput("");
        setPrecioDetalModificadoManually(false);
      } catch (err) {
        handleApiError(err, "guardado de producto");
      }
    };

    // Agregar o editar materia al producto
    const agregarMateriaAlProducto = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const idMateria = materiaNueva.idMateria;
      const cantidad = Number(materiaNueva.cantidad);
      if (cantidad < 0.0000001) {
        setError("La cantidad debe ser mayor o igual a 0.0000001.");
        return;
      }
      const materia = (registrosMateria || []).find(
        (m) => m.idMateria === idMateria
      );
      if (!materia) {
        setModalAdvertenciaIdInvalido(true);
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
      setMateriaNueva({ idMateria: "", cantidad: 0 });
      setModalMateriaAbierta(false);
    };

    // Confirmar disminución de stock
    const confirmarDisminuirStock = async () => {
      if (!token) {
        setError(
          "No se encontró un token de autenticación. Por favor, inicia sesión."
        );
        setModalConfirmDecrease(false);
        return;
      }
      const disminuir = Math.floor(Number(cantidadDisminuir));
      if (disminuir <= 0) {
        setError("Cantidad inválida a disminuir.");
        setModalConfirmDecrease(false);
        return;
      }
      const currentStock = Number(productoStock?.stock || 0);
      if (disminuir > currentStock) {
        setError("No puedes disminuir más que el stock actual.");
        setModalConfirmDecrease(false);
        return;
      }
      try {
        const headers = authHeaders();
        await api.put(
          `/inventarioProducto/${productoStock.idProducto}/disminuir-stock`,
          { cantidadADisminuir: disminuir, notas: notasStock || null },
          { headers }
        );
        await cargarDatosFromBackend();
        setModalConfirmDecrease(false);
        setModalStock(false);
        setCantidadDisminuir(0);
        setDisminuirChecked(false);
        setNotasStock("");
      } catch (err) {
        handleApiError(err, "disminuir stock");
      }
    };

    const actualizarStock = async (e) => {
      e.preventDefault();
      if (!token) {
        setError(
          "No se encontró un token de autenticación. Por favor, inicia sesión."
        );
        return;
      }
      if (disminuirChecked) {
        const disminuir = Math.floor(Number(cantidadDisminuir));
        if (disminuir <= 0) {
          setError("La cantidad a disminuir debe ser un entero mayor que 0.");
          return;
        }
        if (!productoStock) {
          setError("Producto inválido.");
          return;
        }
        if (disminuir > Number(productoStock.stock || 0)) {
          setError(
            "La cantidad a disminuir no puede ser mayor al stock actual."
          );
          return;
        }
        setModalConfirmDecrease(true);
        return;
      }
      const cantidadAAgregar = Math.floor(Number(nuevaCantidad));
      if (cantidadAAgregar <= 0) {
        setError("La cantidad a agregar debe ser un entero mayor que 0");
        return;
      }
      if (esProductoFabricado) {
        if (maxFabricable !== null && cantidadAAgregar > maxFabricable) {
          setModalErrorStockInsuficiente(true);
          return;
        }
      }
      try {
        const headers = authHeaders();
        const currentStock = Number(productoStock.stock || 0);
        const nuevaCantidadTotal = currentStock + cantidadAAgregar;
        const payload = {
          nuevaCantidad: nuevaCantidadTotal,
          notas: cantidadAAgregar > 0 ? notasStock || null : null,
        };
        await api.put(
          `/inventarioProducto/${productoStock.idProducto}/stock`,
          payload,
          { headers }
        );
        await cargarDatosFromBackend();
        setModalStock(false);
        setNuevaCantidad(0);
        setNotasStock("");
      } catch (err) {
        handleApiError(err, "actualización de stock");
      }
    };

    // Paginador con ellipsis
    const renderPageButtons = (totalPages, currentPage, setPageFn) => {
      if (totalPages <= 1) return null;
      const delta = 2;
      const range = [];
      for (let i = 1; i <= totalPages; i++) {
        if (
          i === 1 ||
          i === totalPages ||
          (i >= currentPage - delta && i <= currentPage + delta)
        ) {
          range.push(i);
        } else if (range[range.length - 1] !== "...") {
          range.push("...");
        }
      }
      return range.map((p, idx) => {
        if (p === "...") {
          return (
            <li key={`dots-${idx}`} className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          );
        }
        return (
          <li
            key={p}
            className={`page-item ${currentPage === p ? "active" : ""}`}
          >
            <button className="page-link" onClick={() => setPageFn(p)}>
              {p}
            </button>
          </li>
        );
      });
    };

    // Paginaciones calculadas
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = registros.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(registros.length / itemsPerPage);
    const indexOfLastCategoria = currentPageCategorias * itemsPerPageCategorias;
    const indexOfFirstCategoria = indexOfLastCategoria - itemsPerPageCategorias;
    const currentCategorias = categorias.slice(
      indexOfFirstCategoria,
      indexOfLastCategoria
    );
    const totalPagesCategorias = Math.ceil(
      categorias.length / itemsPerPageCategorias
    );
    const indexOfLastProduccion = currentPageLotes * itemsPerPageLotes;
    const indexOfFirstProduccion = indexOfLastProduccion - itemsPerPageLotes;
    const currentProducciones = lotesUsadosProducto.slice(
      indexOfFirstProduccion,
      indexOfLastProduccion
    );
    const totalPagesLotes = Math.ceil(
      lotesUsadosProducto.length / itemsPerPageLotes
    );

    if (isLoading) {
      return <div className="text-center mt-5">Cargando productos...</div>;
    }

    return (
      <div className="container inventario">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Costo</th>
              <th>Precio Detal</th>
              <th>Precio Mayorista</th>
              <th>Stock actual</th>
              <th>Stock Mínimo</th>
              <th>Stock Máximo</th>
              <th>Categoría</th>
              <th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((p) => (
              <tr key={p.idProducto}>
                <td>{p.idProducto}</td>
                <td>{p.nombre}</td>
                <td>{formatCurrency(p.costo)}</td>
                <td>{formatCurrency(p.precioDetal)}</td>
                <td>
                  {p.precioMayorista != null
                    ? formatCurrency(p.precioMayorista)
                    : "N/A"}
                </td>
                <td>{p.stock || 0}</td>
                <td>{p.stockMinimo != null ? p.stockMinimo : "N/A"}</td>
                <td>{p.stockMaximo != null ? p.stockMaximo : "N/A"}</td>
                <td>
                  {categorias.find(
                    (cat) => cat.idCategoria === p.idCategoria?.idCategoria
                  )?.nombre || "Sin categoría"}
                </td>
                <td>
                  <BotonEditar onClick={() => abrirModalEditar(p)}>
                    Editar
                  </BotonEditar>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => abrirModalStock(p)}
                  >
                    Stock
                  </button>
                  <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => abrirModalLotesUsados(p)}
                  >
                    Lotes Usados
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación productos */}
        <nav>
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                Anterior
              </button>
            </li>
            {renderPageButtons(totalPages, currentPage, setCurrentPage)}
            <li
              className={`page-item ${currentPage === totalPages ? "disabled" : ""
                }`}
            >
              <button
                className="page-link"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
              >
                Siguiente
              </button>
            </li>
          </ul>
        </nav>

        <div className="mt-4">
          <button
            type="button"
            className="btn btn-primary mb-3"
            onClick={() => abrirModalCategoria()}
            style={{ position: "relative", zIndex: 0 }}
          >
            Gestionar Categorías
          </button>
          <h5>Categorías Existentes</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentCategorias.map((c) => (
                <tr key={c.idCategoria}>
                  <td>{c.idCategoria}</td>
                  <td>{c.nombre}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => abrirModalCategoria(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => eliminarCategoria(c.idCategoria)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginador de categorías */}
          <nav>
            <ul className="pagination justify-content-center">
              <li
                className={`page-item ${currentPageCategorias === 1 ? "disabled" : ""
                  }`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    setCurrentPageCategorias(
                      Math.max(1, currentPageCategorias - 1)
                    )
                  }
                >
                  Anterior
                </button>
              </li>
              {renderPageButtons(
                totalPagesCategorias,
                currentPageCategorias,
                setCurrentPageCategorias
              )}
              <li
                className={`page-item ${currentPageCategorias === totalPagesCategorias
                  ? "disabled"
                  : ""
                  }`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    setCurrentPageCategorias(
                      Math.min(totalPagesCategorias, currentPageCategorias + 1)
                    )
                  }
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Modales */}
        {modalAbierta && (
          <Modal isOpen={modalAbierta} onClose={() => setModalAbierta(false)}>
            <form onSubmit={guardarProducto}>
              <div className="mb-3 text-center">
                <h4>{productoSeleccionado ? "Editar" : "Agregar"} Producto</h4>
              </div>
              <div className="mb-3">
                <label className="form-label">ID Producto</label>
                <input
                  type="text"
                  className="form-control"
                  value={formularioTemp.idProducto || ""}
                  required={!productoSeleccionado}
                  disabled={!!productoSeleccionado}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[^a-zA-Z0-9-_]/g, "")
                      .trim();
                    setFormularioTemp((prev) => ({
                      ...prev,
                      idProducto: value,
                    }));
                  }}
                />
                {productoSeleccionado && (
                  <small className="form-text text-muted">
                    El ID no puede modificarse al editar un producto.
                  </small>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={formularioTemp.nombre || ""}
                  required
                  onChange={(e) =>
                    manejarCambioNombre(e, setFormularioTemp, "nombre")
                  }
                />
                <small className="form-text text-muted">
                  Permite letras, números, espacios, guiones y guiones bajos.
                </small>
              </div>
              <div className="mb-3">
                <label className="form-label">Tipo de Producto</label>
                <div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="tipoProducto"
                      id="productoFabricado"
                      checked={esProductoFabricado}
                      onChange={() => setEsProductoFabricado(true)}
                      disabled={
                        productoSeleccionado &&
                        productoSeleccionado.materias?.length > 0
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="productoFabricado"
                    >
                      Producto Fabricado
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="tipoProducto"
                      id="productoTerminado"
                      checked={!esProductoFabricado}
                      onChange={() => setEsProductoFabricado(false)}
                      disabled={
                        productoSeleccionado &&
                        productoSeleccionado.materias?.length > 0
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="productoTerminado"
                    >
                      Producto Terminado
                    </label>
                  </div>
                </div>
                {productoSeleccionado &&
                  productoSeleccionado.materias?.length > 0 && (
                    <small className="form-text text-muted">
                      No se puede cambiar a producto terminado si ya tiene
                      materias primas asociadas.
                    </small>
                  )}
              </div>
              <div className="mb-3">
                <label className="form-label">Costo Unitario (COP)</label>
                <input
                  type="number"
                  className="form-control"
                  value={
                    esProductoFabricado ? costoTotal : formularioTemp.costo
                  }
                  min="0"
                  step="0.01"
                  disabled={esProductoFabricado}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    setFormularioTemp((prev) => ({ ...prev, costo: value }));
                    if (!esProductoFabricado) {
                      setCostoTotal(value);
                    }
                  }}
                />
                <small className="form-text text-muted">
                  {esProductoFabricado
                    ? "El costo se calcula automáticamente según las materias primas asociadas."
                    : "Ingresa el costo del producto terminado."}
                </small>
              </div>
              <div className="mb-3">
                <label className="form-label">Porcentaje de Ganancia (%)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-control"
                  value={formularioTemp.porcentajeGanancia}
                  maxLength="3"
                  required
                  onChange={(e) => {
                    const valor = e.target.value;

                    // Solo permite dígitos y máximo 3 caracteres
                    if (!/^\d{0,3}$/.test(valor)) {
                      return; // No actualiza si no cumple el patrón
                    }

                    // Si está vacío, permitir temporalmente para que el usuario pueda escribir
                    if (valor === '') {
                      setFormularioTemp((prev) => ({
                        ...prev,
                        porcentajeGanancia: '',
                      }));
                      return;
                    }

                    const numeroValor = parseInt(valor, 10);

                    // Validar rango 1-100
                    if (numeroValor < 1 || numeroValor > 100) {
                      return; // No actualiza si está fuera del rango
                    }

                    setFormularioTemp((prev) => ({
                      ...prev,
                      porcentajeGanancia: numeroValor,
                    }));
                  }}
                  onBlur={(e) => {
                    // Al perder el foco, asegurar que hay un valor válido
                    const valor = e.target.value;
                    if (valor === '' || parseInt(valor, 10) < 1) {
                      setFormularioTemp((prev) => ({
                        ...prev,
                        porcentajeGanancia: 1,
                      }));
                    }
                  }}
                  placeholder="1-100"
                />
                <small className="form-text text-muted">
                  Ingresa un valor entre 1% y 100%. Ajusta para calcular el precio detal automáticamente.
                </small>
                {/* Indicador visual opcional para mostrar si el valor está fuera de rango */}
                {(formularioTemp.porcentajeGanancia === '' ||
                  formularioTemp.porcentajeGanancia < 1 ||
                  formularioTemp.porcentajeGanancia > 100) && (
                    <div className="invalid-feedback" style={{ display: 'block', fontSize: '0.875rem', color: '#dc3545' }}>
                      El porcentaje debe estar entre 1 y 100
                    </div>
                  )}
              </div>
              <div className="mb-3">
                <label className="form-label">Precio Detal (COP)</label>
                <input
                  type="number"
                  className="form-control"
                  value={precioDetalInput}
                  min="0.01"
                  step="0.01"
                  required
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    setPrecioDetalInput(value);
                    setFormularioTemp((prev) => ({
                      ...prev,
                      precioDetal: value,
                    }));
                    setPrecioDetalModificadoManually(true);
                  }}
                />
                <small className="form-text text-muted">
                  Si modificas el precio detal manualmente, ese valor se
                  conservará; si no, se calcula con el costo y porcentaje.
                </small>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Precio Mayorista (COP, opcional)
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={precioMayoristaInput}
                  placeholder="Opcional"
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? "" : Number(e.target.value);
                    setPrecioMayoristaInput(value);
                    setFormularioTemp((prev) => ({
                      ...prev,
                      precioMayorista: value === "" ? null : value,
                    }));
                  }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Stock Mínimo (opcional)</label>
                <input
                  type="number"
                  className="form-control"
                  value={
                    formularioTemp.stockMinimo != null
                      ? formularioTemp.stockMinimo
                      : ""
                  }
                  min="0"
                  step="1"
                  placeholder="Opcional"
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? null
                        : Math.floor(Number(e.target.value));
                    setFormularioTemp((prev) => ({
                      ...prev,
                      stockMinimo: value,
                    }));
                  }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Stock Máximo (opcional)</label>
                <input
                  type="number"
                  className="form-control"
                  value={
                    formularioTemp.stockMaximo != null
                      ? formularioTemp.stockMaximo
                      : ""
                  }
                  min="0"
                  step="1"
                  placeholder="Opcional"
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? null
                        : Math.floor(Number(e.target.value));
                    setFormularioTemp((prev) => ({
                      ...prev,
                      stockMaximo: value,
                    }));
                  }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">¿Tiene IVA?</label>
                {!productoSeleccionado ? (
                  <div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="ivaRadio"
                        id="ivaSi"
                        value="true"
                        checked={formularioTemp.iva === true}
                        onChange={() =>
                          setFormularioTemp((p) => ({ ...p, iva: true }))
                        }
                        required
                      />
                      <label className="form-check-label" htmlFor="ivaSi">
                        Sí
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="ivaRadio"
                        id="ivaNo"
                        value="false"
                        checked={formularioTemp.iva === false}
                        onChange={() =>
                          setFormularioTemp((p) => ({ ...p, iva: false }))
                        }
                        required
                      />
                      <label className="form-check-label" htmlFor="ivaNo">
                        No
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="ivaRadioEdit"
                        id="ivaSiEdit"
                        value="true"
                        checked={Boolean(formularioTemp.iva)}
                        onChange={() =>
                          setFormularioTemp((p) => ({ ...p, iva: true }))
                        }
                      />
                      <label className="form-check-label" htmlFor="ivaSiEdit">
                        Sí
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="ivaRadioEdit"
                        id="ivaNoEdit"
                        value="false"
                        checked={!formularioTemp.iva}
                        onChange={() =>
                          setFormularioTemp((p) => ({ ...p, iva: false }))
                        }
                      />
                      <label className="form-check-label" htmlFor="ivaNoEdit">
                        No
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={formularioTemp.idCategoria || ""}
                  onChange={(e) =>
                    setFormularioTemp((prev) => ({
                      ...prev,
                      idCategoria: e.target.value ? Number(e.target.value) : "",
                    }))
                  }
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.idCategoria} value={c.idCategoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {esProductoFabricado && (
                <>
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
                      {materiasProducto.map((m, i) => {
                        const materia = (registrosMateria || []).find(
                          (rm) => rm.idMateria === m.idMateria
                        );
                        return (
                          <tr key={i}>
                            <td>{m.idMateria}</td>
                            <td>{materia ? materia.nombre : "N/A"}</td>
                            <td>{m.cantidad}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary me-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setModoEdicionMateria(true);
                                  setIndiceEdicionMateria(i);
                                  setMateriaNueva({
                                    idMateria: m.idMateria,
                                    cantidad: m.cantidad,
                                  });
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
                                }}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    className="btn btn-success mt-2"
                    onClick={() => {
                      setModoEdicionMateria(false);
                      setMateriaNueva({ idMateria: "", cantidad: 0 });
                      setModalMateriaAbierta(true);
                    }}
                  >
                    Agregar Materia Prima
                  </button>
                </>
              )}
              <div className="d-flex justify-content-end mt-3">
                <BotonCancelar onClick={() => setModalAbierta(false)} />
                <BotonGuardar type="submit" />
              </div>
            </form>
          </Modal>
        )}
        {modalMateriaAbierta && (
          <Modal
            isOpen={modalMateriaAbierta}
            onClose={() => setModalMateriaAbierta(false)}
          >
            <form onSubmit={agregarMateriaAlProducto}>
              <h5 className="text-center">
                {modoEdicionMateria ? "Editar" : "Agregar"} Materia Prima
              </h5>
              <div className="mb-3">
                <label className="form-label">Materia Prima</label>
                <select
                  className="form-select"
                  value={materiaNueva.idMateria || ""}
                  disabled={modoEdicionMateria}
                  onChange={(e) =>
                    setMateriaNueva({
                      ...materiaNueva,
                      idMateria: e.target.value || "",
                    })
                  }
                  required
                  size={8}
                >
                  <option value="">Selecciona una materia prima</option>
                  {(registrosMateria || []).map((m) => (
                    <option key={m.idMateria} value={m.idMateria}>
                      {m.nombre} (ID: {m.idMateria})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Cantidad Requerida</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="form-control"
                  value={materiaNueva.cantidad || ""}
                  required
                  pattern="^\d+(\.\d{1,6})?$"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d{0,6}$/.test(value)) {
                      setMateriaNueva({
                        ...materiaNueva,
                        cantidad: value,
                      });
                    }
                  }}
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
              <h5 className="text-center">
                Gestionar stock de <strong>{productoStock?.nombre}</strong>
              </h5>
              {maxFabricable !== null && esProductoFabricado && (
                <div className="alert alert-info">
                  Puedes fabricar hasta <strong>{maxFabricable}</strong>{" "}
                  unidades con el inventario actual.
                </div>
              )}
              <div className="alert alert-primary">
                Cantidad actual es <strong>{productoStock?.stock}</strong>{" "}
                unidades.
              </div>
              <div className="mb-3">
                <label className="form-label">Nueva cantidad total</label>
                <input
                  name="stockCantidad"
                  type="number"
                  required={!disminuirChecked}
                  className="form-control"
                  min="0"
                  step="1"
                  value={nuevaCantidad}
                  onChange={(e) =>
                    setNuevaCantidad(Math.floor(Number(e.target.value)) || 0)
                  }
                  disabled={disminuirChecked}
                />
                <div className="form-text">
                  Introduce la nueva cantidad total de stock.
                </div>
              </div>
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="disminuirCheck"
                  checked={disminuirChecked}
                  onChange={(e) => {
                    setDisminuirChecked(e.target.checked);
                    if (e.target.checked) {
                      setNuevaCantidad(0);
                      setNotasStock("");
                    } else {
                      setCantidadDisminuir(0);
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="disminuirCheck">
                  ¿Se perdieron productos y quieres disminuir stock? Marca si
                  ese es el caso
                </label>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  ¿Cuántas unidades quieres disminuir?
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  step="1"
                  value={cantidadDisminuir}
                  onChange={(e) =>
                    setCantidadDisminuir(
                      Math.floor(Number(e.target.value)) || 0
                    )
                  }
                  disabled={!disminuirChecked}
                  placeholder="¿Cuántas unidades quieres disminuir?"
                />
                <div className="form-text">
                  Al marcar la opción anterior, este valor se usará para{" "}
                  <strong>reducir</strong> el stock.
                </div>
              </div>
              {((!disminuirChecked && nuevaCantidad > 0) ||
                (disminuirChecked && cantidadDisminuir > 0)) && (
                  <div className="mb-3">
                    <label className="form-label">Notas (opcional)</label>
                    <textarea
                      className="form-control"
                      value={notasStock}
                      onChange={(e) => setNotasStock(e.target.value)}
                      placeholder="Ingresa notas sobre el cambio de stock"
                      rows="3"
                    />
                    <div className="form-text">
                      Notas opcionales para registrar detalles del cambio de
                      stock.
                    </div>
                  </div>
                )}
              <div className="d-flex justify-content-end">
                <BotonCancelar
                  onClick={() => {
                    setModalStock(false);
                    setDisminuirChecked(false);
                    setCantidadDisminuir(0);
                    setNotasStock("");
                  }}
                />
                <BotonGuardar type="submit" />
              </div>
            </form>
          </Modal>
        )}
        {modalConfirmDecrease && (
          <Modal
            isOpen={modalConfirmDecrease}
            onClose={() => setModalConfirmDecrease(false)}
          >
            <div className="encabezado-modal">
              <h2>Confirmar disminución</h2>
            </div>
            <p className="text-center">
              ¿Estás seguro de querer disminuir{" "}
              <strong>{cantidadDisminuir}</strong> unidades de{" "}
              <strong>{productoStock?.nombre}</strong>? Esta acción afectará el
              stock.
              {notasStock && (
                <>
                  <br />
                  <strong>Notas:</strong> {notasStock}
                </>
              )}
            </p>
            <div className="d-flex justify-content-end">
              <BotonCancelar onClick={() => setModalConfirmDecrease(false)} />
              <BotonAceptar onClick={confirmarDisminuirStock} />
            </div>
          </Modal>
        )}
        {modalAdvertenciaPocoStock && (
          <Modal
            isOpen={modalAdvertenciaPocoStock}
            onClose={() => setModalAdvertenciaPocoStock(false)}
          >
            <div className="encabezado-modal">
              <h2>Advertencia</h2>
            </div>
            <p className="text-center">
              ¡Materia prima <strong>Insuficiente</strong> para aumentar el
              stock!
            </p>
            <div className="modal-footer">
              <BotonAceptar
                onClick={() => setModalAdvertenciaPocoStock(false)}
              />
            </div>
          </Modal>
        )}
        {modalAdvertenciaIdInvalido && (
          <Modal
            isOpen={modalAdvertenciaIdInvalido}
            onClose={() => setModalAdvertenciaIdInvalido(false)}
          >
            <div className="encabezado-modal">
              <h2>Advertencia</h2>
            </div>
            <p className="text-center">
              ¡No existe ninguna Materia prima con el ID{" "}
              <strong>{materiaNueva.idMateria}</strong>!
            </p>
            <div className="modal-footer">
              <BotonAceptar
                onClick={() => setModalAdvertenciaIdInvalido(false)}
              />
            </div>
          </Modal>
        )}
        {modalAdvertenciaMateriaAgregada && (
          <Modal
            isOpen={modalAdvertenciaMateriaAgregada}
            onClose={() => setModalAdvertenciaMateriaAgregada(false)}
          >
            <div className="encabezado-modal">
              <h2>Advertencia</h2>
            </div>
            <p className="text-center">
              ¡La materia prima con el ID{" "}
              <strong>{materiaNueva.idMateria}</strong> ya está agregada!
            </p>
            <div className="modal-footer">
              <BotonAceptar
                onClick={() => setModalAdvertenciaMateriaAgregada(false)}
              />
            </div>
          </Modal>
        )}
        {modalAdvertenciaIdDuplicado && (
          <Modal
            isOpen={modalAdvertenciaIdDuplicado}
            onClose={() => setModalAdvertenciaIdDuplicado(false)}
          >
            <div className="encabezado-modal">
              <h2>Advertencia</h2>
            </div>
            <p className="text-center">
              ¡Ya existe un producto con el ID{" "}
              <strong>{formularioTemp.idProducto}</strong>!
            </p>
            <div className="modal-footer">
              <BotonAceptar
                onClick={() => setModalAdvertenciaIdDuplicado(false)}
              />
            </div>
          </Modal>
        )}
        {modalErrorStockInsuficiente && (
          <Modal
            isOpen={modalErrorStockInsuficiente}
            onClose={() => setModalErrorStockInsuficiente(false)}
          >
            <div className="encabezado-modal">
              <h2>Error</h2>
            </div>
            <p className="text-center">
              No cuentas con la materia prima suficiente para crear esa cantidad
              de productos
            </p>
            <div className="modal-footer">
              <BotonAceptar
                onClick={() => setModalErrorStockInsuficiente(false)}
              />
            </div>
          </Modal>
        )}
        {modalLotesUsados && (
          <Modal
            isOpen={modalLotesUsados}
            onClose={() => {
              setModalLotesUsados(false);
              setProductoLotesSeleccionado(null);
              setFilterDate("");
            }}
          >
            <div className="modal-content-custom">
              {/* Modal Header */}
              <button
                type="button"
                className="btn-close-custom"
                onClick={() => {
                  setModalLotesUsados(false);
                  setProductoLotesSeleccionado(null);
                  setFilterDate("");
                }}
                aria-label="Close"
              ></button>
              <h2 className="modal-title-custom">Lotes Usados en Producto</h2>

              {/* Filter Section */}
              <div className="filter-section">
                <label className="form-label filter-label">
                  Filtrar por fecha de producción:
                </label>
                <input
                  type="date"
                  className="form-control filter-input"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary filter-btn"
                  onClick={() => setFilterDate("")}
                >
                  Limpiar Filtro
                </button>
              </div>

              {/* Scrollable Table Container */}
              <div className="table-container">
                {currentProducciones.length > 0 ? (
                  <table className="table table-custom">
                    <thead>
                      <tr>
                        <th>ID Producción</th>
                        <th>Lote</th>
                        <th>Materia Prima</th>
                        <th>Proveedor</th>
                        <th>Cantidad Inicial</th>
                        <th>Cant. Antes</th>
                        <th>Cant. Usada</th>
                        <th>Cant. Después</th>
                        <th>Fecha Ingreso</th>
                        <th>Fecha Producción</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducciones.map((prod) =>
                        prod.lotes.map((lu, index) => (
                          <tr
                            key={`${prod.idProduccion}-${lu.id}`}
                            className="table-row"
                          >
                            {index === 0 && (
                              <td rowSpan={prod.lotes.length}>
                                {prod.idProduccion}
                              </td>
                            )}
                            <td>{lu.idLote}</td>
                            <td>{lu.materiaNombre}</td>
                            <td>{lu.proveedorNombre}</td>
                            <td>{lu.cantidadInicial}</td>
                            <td>{lu.cantidadAntesFabricacion}</td>
                            <td>{lu.cantidadUsada}</td>
                            <td>{lu.cantidadDespuesFabricacion}</td>
                            <td>{lu.fechaIngreso}</td>
                            <td>{lu.fechaProduccion}</td>
                            <td>{lu.notas || "N/A"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data">No hay lotes usados para mostrar.</p>
                )}
              </div>

              {/* Pagination and Footer */}
              <div className="modal-footer-custom">
                <nav>
                  <ul className="pagination justify-content-center">
                    <li
                      className={`page-item ${currentPageLotes === 1 ? "disabled" : ""
                        }`}
                    >
                      <button
                        className="page-link page-link-custom"
                        onClick={() =>
                          setCurrentPageLotes(Math.max(1, currentPageLotes - 1))
                        }
                      >
                        Anterior
                      </button>
                    </li>
                    {renderPageButtons(
                      totalPagesLotes,
                      currentPageLotes,
                      setCurrentPageLotes
                    )}
                    <li
                      className={`page-item ${currentPageLotes === totalPagesLotes ? "disabled" : ""
                        }`}
                    >
                      <button
                        className="page-link page-link-custom"
                        onClick={() =>
                          setCurrentPageLotes(
                            Math.min(totalPagesLotes, currentPageLotes + 1)
                          )
                        }
                      >
                        Siguiente
                      </button>
                    </li>
                  </ul>
                </nav>
                <BotonAceptar
                  className="btn btn-primary accept-btn"
                  onClick={() => {
                    setModalLotesUsados(false);
                    setProductoLotesSeleccionado(null);
                    setFilterDate("");
                  }}
                />
              </div>
            </div>
          </Modal>
        )}
        {modalCategoriaAbierta && (
          <Modal
            isOpen={modalCategoriaAbierta}
            onClose={() => setModalCategoriaAbierta(false)}
          >
            <form onSubmit={guardarCategoria}>
              <h5 className="text-center">
                {modoEdicionCategoria ? "Editar" : "Agregar"} Categoría
              </h5>
              <div className="mb-3">
                <label className="form-label">Nombre de la Categoría</label>
                <input
                  type="text"
                  className="form-control"
                  value={nuevaCategoria.nombre}
                  required
                  onChange={(e) =>
                    manejarCambioNombre(e, setNuevaCategoria, "nombre")
                  }
                />
              </div>
              <div className="d-flex justify-content-end">
                <BotonCancelar
                  onClick={() => setModalCategoriaAbierta(false)}
                />
                <BotonGuardar type="submit" />
              </div>
            </form>
          </Modal>
        )}
        {modalConfirmDeleteCategoria && (
          <Modal
            isOpen={modalConfirmDeleteCategoria}
            onClose={() => setModalConfirmDeleteCategoria(false)}
          >
            <div className="encabezado-modal">
              <h2>Advertencia</h2>
            </div>
            <p className="text-center">
              Esta categoría está presente en los productos:{" "}
              {productosAsociadosToDelete.map((p) => p.nombre).join(", ")}.
              ¿Desea eliminarla y asignar 'Sin categoría' a estos productos?
            </p>
            <div className="d-flex justify-content-end">
              <BotonCancelar
                onClick={() => setModalConfirmDeleteCategoria(false)}
              />
              <BotonAceptar
                onClick={() =>
                  eliminarCategoria(categoriaToDelete, { force: true })
                }
              />
            </div>
          </Modal>
        )}
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
      </div>
    );
  }
);

export default TablaProductos;