'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  X,
  Phone,
  Calendar,
  Sparkles,
  ArrowLeft,
  Sliders,
  AlertCircle,
  TrendingUp,
  Receipt,
  Copy,
  Check,
  FileText,
  Tag,
  AlertTriangle,
  Info,
  CreditCard,
  Layers,
  ExternalLink,
  ChevronRight,
  Hash
} from 'lucide-react';

export default function AdminPage() {
  // Estado de Autenticación
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Estado del Dashboard
  const [loadingData, setLoadingData] = useState(false);
  const [negocios, setNegocios] = useState([]);
  const [vendedoresTotales, setVendedoresTotales] = useState([]);
  const [inventarioGlobal, setInventarioGlobal] = useState({ totalProductos: 0, valorTotal: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos', 'activos', 'inactivos'

  // Estado para Edición Rápida de Cliente
  const [clienteEditando, setClienteEditando] = useState(null);
  const [editPlan, setEditPlan] = useState('Negocio Pro');
  const [editMeses, setEditMeses] = useState(1);
  const [editNombre, setEditNombre] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [toastMensaje, setToastMensaje] = useState(null);

  // Acordeón de Vendedores expandidos por ID de negocio en la tarjeta principal
  const [vendedoresExpandidos, setVendedoresExpandidos] = useState({});

  // =========================================================================
  // ESTADOS PARA RADIOGRAFÍA DEL NEGOCIO (MODAL DETALLADO)
  // =========================================================================
  const [negocioDetalle, setNegocioDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [inventarioNegocio, setInventarioNegocio] = useState([]);
  const [ventasNegocio, setVentasNegocio] = useState([]);
  const [tabRadiografia, setTabRadiografia] = useState('inventario'); // 'inventario', 'ventas', 'vendedores', 'ficha'
  const [busquedaProdModal, setBusquedaProdModal] = useState('');
  const [filtroStockModal, setFiltroStockModal] = useState('todos'); // 'todos', 'agotado', 'bajo', 'normal'
  const [busquedaVentaModal, setBusquedaVentaModal] = useState('');
  const [descripcionExpandida, setDescripcionExpandida] = useState({});
  const [copiadoJson, setCopiadoJson] = useState(false);

  // 1. Escuchar estado de autenticación en Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Cargar datos cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      cargarDatosDashboard();
    }
  }, [user]);

  // Cerrar modales con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (negocioDetalle) setNegocioDetalle(null);
        if (clienteEditando) setClienteEditando(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [negocioDetalle, clienteEditando]);

  const mostrarToast = (msg) => {
    setToastMensaje(msg);
    setTimeout(() => {
      setToastMensaje(null);
    }, 4000);
  };

  // Función para consultar Firestore y armar métricas globales
  const cargarDatosDashboard = async () => {
    setLoadingData(true);
    try {
      // 1. Obtener todos los clientes_saas
      const saasSnap = await getDocs(collection(db, 'clientes_saas'));
      const todosClientes = [];
      saasSnap.forEach((docItem) => {
        todosClientes.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      // 2. Obtener todo el inventario
      const invSnap = await getDocs(collection(db, 'inventario'));
      const mapaInventarioPorCliente = {};
      let granTotalValor = 0;
      let granTotalProds = 0;

      invSnap.forEach((docItem) => {
        const prod = docItem.data();
        const clienteId = String(prod.cliente_id || '').trim();
        const stock = Number(prod.stock) || 0;
        const costo = Number(prod.costo) || 0;
        const precioSugerido = Number(prod.precio_sugerido) || 0;
        const valorItem = stock * costo;
        const valorVentaItem = stock * precioSugerido;

        granTotalValor += valorItem;
        granTotalProds += 1;

        if (!mapaInventarioPorCliente[clienteId]) {
          mapaInventarioPorCliente[clienteId] = {
            totalProductos: 0,
            totalUnidades: 0,
            valorTotalInventario: 0,
            valorTotalVenta: 0
          };
        }

        mapaInventarioPorCliente[clienteId].totalProductos += 1;
        mapaInventarioPorCliente[clienteId].totalUnidades += stock;
        mapaInventarioPorCliente[clienteId].valorTotalInventario += valorItem;
        mapaInventarioPorCliente[clienteId].valorTotalVenta += valorVentaItem;
      });

      setInventarioGlobal({
        totalProductos: granTotalProds,
        valorTotal: granTotalValor
      });

      // 3. Separar Dueños y Vendedores
      const listaVendedores = todosClientes.filter(
        (c) => c.rol && String(c.rol).toLowerCase().includes('vendedor')
      );
      setVendedoresTotales(listaVendedores);

      const listaDuenos = todosClientes.filter(
        (c) => !c.rol || !String(c.rol).toLowerCase().includes('vendedor')
      );

      // 4. Vincular cada Dueño con sus Vendedores y métricas de Inventario
      const dueñosConsolidados = listaDuenos.map((dueno) => {
        const duenoId = String(dueno.id);
        const vendedoresVinculados = listaVendedores.filter(
          (v) => String(v.negocio_id) === duenoId
        );

        const invInfo = mapaInventarioPorCliente[duenoId] || {
          totalProductos: 0,
          totalUnidades: 0,
          valorTotalInventario: 0,
          valorTotalVenta: 0
        };

        // Calcular meses de permanencia
        let mesesCalculados = dueno.meses_consecutivos || 1;
        if (!dueno.meses_consecutivos && dueno.fecha_aprobacion) {
          const fechaInicio = dueno.fecha_aprobacion.toDate
            ? dueno.fecha_aprobacion.toDate()
            : new Date(dueno.fecha_aprobacion);
          const diffTime = Math.abs(new Date() - fechaInicio);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          mesesCalculados = Math.max(1, Math.ceil(diffDays / 30));
        }

        return {
          ...dueno,
          plan: dueno.plan || 'Negocio Pro',
          meses_consecutivos: mesesCalculados,
          vendedores: vendedoresVinculados,
          inventario: invInfo
        };
      });

      setNegocios(dueñosConsolidados);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      mostrarToast(`❌ Error al conectar con Firestore: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  // Manejador de Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      console.error('Error en login:', err);
      setAuthError('Credenciales incorrectas o usuario no registrado como Super Admin.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Manejador de Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // Toggle rápido de Suscripción Activa para Dueños
  const toggleSuscripcion = async (clienteId, estadoActual) => {
    const nuevoEstado = !estadoActual;
    try {
      await updateDoc(doc(db, 'clientes_saas', String(clienteId)), {
        suscripcion_activa: nuevoEstado,
        fecha_actualizacion: new Date()
      });

      // Actualizar estado local
      setNegocios((prev) =>
        prev.map((n) =>
          n.id === clienteId ? { ...n, suscripcion_activa: nuevoEstado } : n
        )
      );

      if (negocioDetalle && negocioDetalle.id === clienteId) {
        setNegocioDetalle((prev) => ({ ...prev, suscripcion_activa: nuevoEstado }));
      }

      mostrarToast(
        nuevoEstado
          ? `✅ Suscripción de ${clienteId} ACTIVADA con éxito.`
          : `⚠️ Suscripción de ${clienteId} SUSPENDIDA.`
      );
    } catch (err) {
      console.error('Error al alternar suscripción:', err);
      mostrarToast(`❌ Error actualizando suscripción: ${err.message}`);
    }
  };

  // Toggle de Suscripción para Vendedores
  const toggleSuscripcionVendedor = async (vendedorId, estadoActual) => {
    const nuevoEstado = !estadoActual;
    try {
      await updateDoc(doc(db, 'clientes_saas', String(vendedorId)), {
        suscripcion_activa: nuevoEstado,
        fecha_actualizacion: new Date()
      });

      setVendedoresTotales((prev) =>
        prev.map((v) => (v.id === vendedorId ? { ...v, suscripcion_activa: nuevoEstado } : v))
      );

      setNegocios((prev) =>
        prev.map((n) => ({
          ...n,
          vendedores: (n.vendedores || []).map((v) =>
            v.id === vendedorId ? { ...v, suscripcion_activa: nuevoEstado } : v
          )
        }))
      );

      if (negocioDetalle) {
        setNegocioDetalle((prev) => ({
          ...prev,
          vendedores: (prev.vendedores || []).map((v) =>
            v.id === vendedorId ? { ...v, suscripcion_activa: nuevoEstado } : v
          )
        }));
      }

      mostrarToast(
        nuevoEstado
          ? `✅ Vendedor ${vendedorId} ACTIVADO.`
          : `⚠️ Vendedor ${vendedorId} PAUSADO.`
      );
    } catch (err) {
      console.error('Error al alternar suscripción de vendedor:', err);
      mostrarToast(`❌ Error: ${err.message}`);
    }
  };

  // Guardar Cambios en Modal de Edición
  const guardarEdicionCliente = async () => {
    if (!clienteEditando) return;
    setGuardandoEdicion(true);
    try {
      const docRef = doc(db, 'clientes_saas', String(clienteEditando.id));
      await updateDoc(docRef, {
        nombre_negocio: editNombre.trim() || 'Sin Nombre',
        plan: editPlan,
        meses_consecutivos: Number(editMeses) || 1,
        fecha_actualizacion: new Date()
      });

      // Actualizar estado local
      setNegocios((prev) =>
        prev.map((n) =>
          n.id === clienteEditando.id
            ? {
                ...n,
                nombre_negocio: editNombre.trim() || 'Sin Nombre',
                plan: editPlan,
                meses_consecutivos: Number(editMeses) || 1
              }
            : n
        )
      );

      if (negocioDetalle && negocioDetalle.id === clienteEditando.id) {
        setNegocioDetalle((prev) => ({
          ...prev,
          nombre_negocio: editNombre.trim() || 'Sin Nombre',
          plan: editPlan,
          meses_consecutivos: Number(editMeses) || 1
        }));
      }

      mostrarToast(`✅ Negocio "${editNombre}" actualizado con éxito.`);
      setClienteEditando(null);
    } catch (err) {
      console.error('Error al guardar edición:', err);
      mostrarToast(`❌ Error: ${err.message}`);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const abrirModalEdicion = (cliente) => {
    setClienteEditando(cliente);
    setEditNombre(cliente.nombre_negocio || '');
    setEditPlan(cliente.plan || 'Negocio Pro');
    setEditMeses(cliente.meses_consecutivos || 1);
  };

  const toggleVendedores = (clienteId) => {
    setVendedoresExpandidos((prev) => ({
      ...prev,
      [clienteId]: !prev[clienteId]
    }));
  };

  // =========================================================================
  // CONTROLADOR DE "VER DETALLES" (RADIOGRAFÍA DEL NEGOCIO)
  // =========================================================================
  const abrirDetallesNegocio = async (negocio) => {
    setNegocioDetalle(negocio);
    setTabRadiografia('inventario');
    setBusquedaProdModal('');
    setBusquedaVentaModal('');
    setFiltroStockModal('todos');
    setDescripcionExpandida({});
    setCargandoDetalle(true);

    const tenantId = String(negocio.negocio_id || negocio.id).trim();
    const duenoId = String(negocio.id).trim();

    try {
      // 1. Obtener inventario filtrado de este negocio
      let prods = [];
      try {
        const qInv = query(collection(db, 'inventario'), where('cliente_id', '==', tenantId));
        const snapInv = await getDocs(qInv);
        snapInv.forEach((d) => prods.push({ id: d.id, ...d.data() }));

        if (prods.length === 0 && tenantId !== duenoId) {
          const qInv2 = query(collection(db, 'inventario'), where('cliente_id', '==', duenoId));
          const snapInv2 = await getDocs(qInv2);
          snapInv2.forEach((d) => prods.push({ id: d.id, ...d.data() }));
        }
      } catch (_) {
        const allInv = await getDocs(collection(db, 'inventario'));
        allInv.forEach((d) => {
          const data = d.data();
          const cid = String(data.cliente_id || '').trim();
          if (cid === tenantId || cid === duenoId) {
            prods.push({ id: d.id, ...data });
          }
        });
      }
      setInventarioNegocio(prods);

      // 2. Obtener ventas filtradas de este negocio
      let ventas = [];
      try {
        const qVentas = query(collection(db, 'ventas'), where('cliente_id', '==', tenantId));
        const snapVentas = await getDocs(qVentas);
        snapVentas.forEach((d) => ventas.push({ id: d.id, ...d.data() }));

        if (ventas.length === 0 && tenantId !== duenoId) {
          const qVentas2 = query(collection(db, 'ventas'), where('cliente_id', '==', duenoId));
          const snapVentas2 = await getDocs(qVentas2);
          snapVentas2.forEach((d) => ventas.push({ id: d.id, ...d.data() }));
        }
      } catch (_) {
        const allV = await getDocs(collection(db, 'ventas'));
        allV.forEach((d) => {
          const data = d.data();
          const cid = String(data.cliente_id || '').trim();
          if (cid === tenantId || cid === duenoId) {
            ventas.push({ id: d.id, ...data });
          }
        });
      }

      // Ordenar ventas por fecha descendente
      ventas.sort((a, b) => {
        const fechaA = a.fecha_venta || a.fecha || 0;
        const fechaB = b.fecha_venta || b.fecha || 0;
        return new Date(fechaB) - new Date(fechaA);
      });
      setVentasNegocio(ventas);
    } catch (err) {
      console.error('Error cargando detalles del negocio:', err);
      mostrarToast(`❌ Error al consultar Firestore: ${err.message}`);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const refrescarDetallesNegocio = () => {
    if (negocioDetalle) {
      abrirDetallesNegocio(negocioDetalle);
    }
  };

  const copiarJsonFicha = async (obj) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
      setCopiadoJson(true);
      setTimeout(() => setCopiadoJson(false), 2500);
    } catch (err) {
      console.error('Error al copiar JSON:', err);
      mostrarToast('❌ No se pudo copiar al portapapeles');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No registrada';
    try {
      let d;
      if (fecha.toDate && typeof fecha.toDate === 'function') {
        d = fecha.toDate();
      } else if (fecha instanceof Date) {
        d = fecha;
      } else {
        d = new Date(fecha);
      }
      if (isNaN(d.getTime())) return String(fecha);
      return d.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return String(fecha);
    }
  };

  // Filtrado de Negocios en el listado principal
  const negociosFiltrados = useMemo(() => {
    return negocios.filter((n) => {
      const coincideBusqueda =
        (n.nombre_negocio && n.nombre_negocio.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(n.id).toLowerCase().includes(searchQuery.toLowerCase());

      if (!coincideBusqueda) return false;

      if (filtroEstado === 'activos') return n.suscripcion_activa === true;
      if (filtroEstado === 'inactivos') return n.suscripcion_activa !== true;

      return true;
    });
  }, [negocios, searchQuery, filtroEstado]);

  // Métricas Consolidadas Globales
  const totalNegocios = negocios.length;
  const suscripcionesActivas = negocios.filter((n) => n.suscripcion_activa === true).length;
  const totalVendedoresCount = vendedoresTotales.length;

  // =========================================================================
  // KPIs FINANCIEROS DEL NEGOCIO SELECCIONADO (MODAL RADIOGRAFÍA)
  // =========================================================================
  const kpisDetalle = useMemo(() => {
    const skus = inventarioNegocio.length;
    const unidades = inventarioNegocio.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
    const costoTotal = inventarioNegocio.reduce(
      (acc, p) => acc + (Number(p.costo) || 0) * (Number(p.stock) || 0),
      0
    );
    const ventaTotal = inventarioNegocio.reduce(
      (acc, p) => acc + (Number(p.precio_sugerido) || 0) * (Number(p.stock) || 0),
      0
    );
    const ganancia = ventaTotal - costoTotal;
    const margen = ventaTotal > 0 ? ((ganancia / ventaTotal) * 100).toFixed(1) : '0';
    const markup = costoTotal > 0 ? ((ganancia / costoTotal) * 100).toFixed(1) : '0';

    return {
      skus,
      unidades,
      costoTotal,
      ventaTotal,
      ganancia,
      margen,
      markup
    };
  }, [inventarioNegocio]);

  // Filtrado de Productos en Pestaña 1 del Modal
  const productosFiltradosModal = useMemo(() => {
    return inventarioNegocio.filter((prod) => {
      const q = busquedaProdModal.toLowerCase().trim();
      const coincideBusqueda =
        !q ||
        (prod.nombre && prod.nombre.toLowerCase().includes(q)) ||
        (prod.descripcion_visual && prod.descripcion_visual.toLowerCase().includes(q)) ||
        String(prod.id).toLowerCase().includes(q);

      if (!coincideBusqueda) return false;

      const stock = Number(prod.stock) || 0;
      if (filtroStockModal === 'agotado') return stock <= 0;
      if (filtroStockModal === 'bajo') return stock > 0 && stock <= 5;
      if (filtroStockModal === 'normal') return stock > 5;

      return true;
    });
  }, [inventarioNegocio, busquedaProdModal, filtroStockModal]);

  // Contadores para filtros de stock en modal
  const contadoresStock = useMemo(() => {
    let agotados = 0;
    let bajos = 0;
    let normales = 0;
    inventarioNegocio.forEach((p) => {
      const st = Number(p.stock) || 0;
      if (st <= 0) agotados += 1;
      else if (st <= 5) bajos += 1;
      else normales += 1;
    });
    return { agotados, bajos, normales };
  }, [inventarioNegocio]);

  // Filtrado de Ventas en Pestaña 2 del Modal
  const ventasFiltradasModal = useMemo(() => {
    return ventasNegocio.filter((v) => {
      const q = busquedaVentaModal.toLowerCase().trim();
      if (!q) return true;
      return (
        (v.nombre_producto && v.nombre_producto.toLowerCase().includes(q)) ||
        (v.metodo_pago && String(v.metodo_pago).toLowerCase().includes(q)) ||
        String(v.id).toLowerCase().includes(q)
      );
    });
  }, [ventasNegocio, busquedaVentaModal]);

  // =========================================================================
  // ESTADO 1: CARGANDO AUTH
  // =========================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium font-mono">Verificando credenciales seguras...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ESTADO 2: PANTALLA DE LOGIN (No Autenticado)
  // =========================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-md glass-card rounded-3xl p-8 sm:p-10 border-white/10 shadow-2xl relative z-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 border border-white/15">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Torre de Control
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              Acceso exclusivo para el Super Administrador de Sofilú AI
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sofilu.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Ingresar al Panel</span>
              )}
            </button>
          </form>

          {/* Footer Back */}
          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la Landing Page</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ESTADO 3: PANEL DEL SUPER ADMINISTRADOR (Autenticado)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col">
      {/* Toast Notification */}
      {toastMensaje && (
        <div className="fixed bottom-6 right-6 z-50 glass-card bg-black/90 border-indigo-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 text-sm font-medium">
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 glass-nav border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white">Sofilú AI</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    SUPER ADMIN
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">Torre de Control SaaS</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarDatosDashboard}
              disabled={loadingData}
              className="p-2.5 rounded-xl glass-card text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
              title="Actualizar Datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ========================================================================= */}
        {/* DASHBOARD DE MÉTRICAS GLOBALES                                           */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Negocios */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Negocios (Dueños)</p>
                <p className="text-3xl font-extrabold text-white mt-1">{totalNegocios}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-emerald-400 font-bold">{suscripcionesActivas} activas</span>
              <span>•</span>
              <span className="text-rose-400 font-bold">{totalNegocios - suscripcionesActivas} pausadas</span>
            </div>
          </div>

          {/* Card 2: Suscripciones Activas */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tasa de Activación</p>
                <p className="text-3xl font-extrabold text-emerald-400 mt-1">
                  {totalNegocios > 0 ? Math.round((suscripcionesActivas / totalNegocios) * 100) : 0}%
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-zinc-400">
              <span>{suscripcionesActivas} clientes con acceso al bot</span>
            </div>
          </div>

          {/* Card 3: Total Vendedores */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Vendedores</p>
                <p className="text-3xl font-extrabold text-indigo-300 mt-1">{totalVendedoresCount}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-zinc-400">
              <span>Roles POS operando con costos ocultos</span>
            </div>
          </div>

          {/* Card 4: Valor Total de Inventario */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Inventario en Plataforma</p>
                <p className="text-2xl font-extrabold text-white mt-1">
                  ${inventarioGlobal.valorTotal.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-zinc-400">
              <span>{inventarioGlobal.totalProductos} productos registrados</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* LISTADO DE CLIENTES Y GESTIÓN SAAS                                        */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          {/* Header & Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Inquilinos y Negocios Registrados</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
                  {negociosFiltrados.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Administra el estado de suscripción, asigna planes, inspecciona finanzas y supervisa los vendedores.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Buscador */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por negocio o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60 transition-all"
                />
              </div>

              {/* Filtro Estado */}
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="todos">Todos los Estados</option>
                <option value="activos">Solo Activos</option>
                <option value="inactivos">Solo Inactivos / Pausados</option>
              </select>
            </div>
          </div>

          {/* Tarjetas de Clientes */}
          {loadingData ? (
            <div className="glass-card rounded-3xl p-12 text-center text-zinc-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
              <p className="text-sm font-medium">Consultando Firestore en tiempo real...</p>
            </div>
          ) : negociosFiltrados.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center text-zinc-400 space-y-3 border-dashed border-white/15">
              <Building2 className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No se encontraron clientes</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No hay negocios que coincidan con los filtros aplicados o aún no se han registrado inquilinos en Firestore.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {negociosFiltrados.map((cliente) => {
                const estaActivo = cliente.suscripcion_activa === true;
                const estaExpandido = Boolean(vendedoresExpandidos[cliente.id]);

                return (
                  <div
                    key={cliente.id}
                    className={`glass-card rounded-2xl border transition-all ${
                      estaActivo ? 'border-white/10 hover:border-white/20' : 'border-rose-500/20 bg-rose-950/10'
                    }`}
                  >
                    {/* Header del Negocio */}
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Información Principal */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-lg font-bold text-white">
                            {cliente.nombre_negocio || 'Negocio Sin Nombre'}
                          </h3>

                          {/* Badge de Suscripción */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              estaActivo
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                estaActivo ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                              }`}
                            />
                            <span>{estaActivo ? 'Activo' : 'Suspendido / Pendiente'}</span>
                          </span>

                          {/* Badge de Plan */}
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            {cliente.plan || 'Negocio Pro'}
                          </span>
                        </div>

                        {/* Subdata: ID, Teléfono, Meses de Pago, SKUs, Unidades, Costo y Venta Estimada */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-sans">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span>ID: {cliente.id}</span>
                          </div>

                          <div className="flex items-center gap-1.5 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{cliente.meses_consecutivos} mes(es)</span>
                          </div>

                          {/* Stock y SKUs */}
                          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-zinc-200">
                            <Package className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-semibold text-white">{cliente.inventario.totalProductos} SKUs</span>
                            <span className="text-zinc-500">•</span>
                            <span>{cliente.inventario.totalUnidades} unds en stock</span>
                          </div>

                          {/* Costo vs Venta Estimada */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-zinc-400">Costo:</span>
                            <span className="font-semibold text-zinc-200">
                              ${cliente.inventario.valorTotalInventario.toLocaleString('es-CO')} COP
                            </span>
                            <span className="text-zinc-600">|</span>
                            <span className="text-zinc-400">Venta Est.:</span>
                            <span className="font-bold text-emerald-400">
                              ${(cliente.inventario.valorTotalVenta || 0).toLocaleString('es-CO')} COP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de Acción Rápida */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                        {/* Botón Destacado: Ver Detalles (Radiografía) */}
                        <button
                          onClick={() => abrirDetallesNegocio(cliente)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          title="Abrir Radiografía del Negocio"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalles</span>
                        </button>

                        {/* Switch de Activación Instantánea */}
                        <button
                          onClick={() => toggleSuscripcion(cliente.id, estaActivo)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            estaActivo
                              ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                          }`}
                        >
                          {estaActivo ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Pausar Acceso</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobar / Activar</span>
                            </>
                          )}
                        </button>

                        {/* Botón Editar Plan */}
                        <button
                          onClick={() => abrirModalEdicion(cliente)}
                          className="px-3 py-2 rounded-xl glass-card text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                          title="Editar Plan y Detalles"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        {/* Botón Desplegar Vendedores */}
                        <button
                          onClick={() => toggleVendedores(cliente.id)}
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Vendedores ({cliente.vendedores?.length || 0})</span>
                          {estaExpandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Desplegable de Vendedores Vinculados en la tarjeta principal */}
                    {estaExpandido && (
                      <div className="px-5 pb-5 pt-3 border-t border-white/5 bg-black/30 rounded-b-2xl space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                          <span>Vendedores vinculados al inventario de este negocio:</span>
                          <span className="text-[11px] text-zinc-500">Operan con costos ocultos</span>
                        </div>

                        {cliente.vendedores && cliente.vendedores.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cliente.vendedores.map((v) => (
                              <div
                                key={v.id}
                                className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs"
                              >
                                <div className="space-y-0.5">
                                  <p className="font-bold text-white flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-indigo-400" />
                                    <span>{v.id}</span>
                                  </p>
                                  <p className="text-[10px] text-zinc-500">
                                    Rol: Vendedor • {v.suscripcion_activa ? 'Activo' : 'Inactivo'}
                                  </p>
                                </div>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    v.suscripcion_activa ? 'bg-emerald-400' : 'bg-rose-400'
                                  }`}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-500">
                            No hay vendedores registrados para este negocio todavía. Para vincular uno, usa el comando en el bot:
                            <code className="ml-2 text-indigo-300 font-mono">
                              /aprobar [ID_VENDEDOR] vendedor {cliente.id}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ========================================================================= */}
      {/* MODAL / PANEL DE RADIOGRAFÍA DEL NEGOCIO (INSPECCIÓN TOTAL)               */}
      {/* ========================================================================= */}
      {negocioDetalle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-full max-h-[94vh] glass-card bg-[#09090f]/95 rounded-3xl border border-white/15 shadow-2xl flex flex-col overflow-hidden">
            {/* Header del Modal */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/20 via-transparent to-violet-950/20">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 border border-white/20 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {negocioDetalle.nombre_negocio || 'Negocio Sin Nombre'}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        negocioDetalle.suscripcion_activa
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          negocioDetalle.suscripcion_activa ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                        }`}
                      />
                      <span>{negocioDetalle.suscripcion_activa ? 'Activo' : 'Suspendido'}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {negocioDetalle.plan || 'Negocio Pro'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      ID: {negocioDetalle.id}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-sans">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {negocioDetalle.meses_consecutivos || 1} mes(es) activo
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones Header Modal */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={refrescarDetallesNegocio}
                  disabled={cargandoDetalle}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Refrescar datos de Firestore"
                >
                  <RefreshCw className={`w-4 h-4 ${cargandoDetalle ? 'animate-spin text-indigo-400' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
                <button
                  onClick={() => setNegocioDetalle(null)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4 Tarjetas KPI Financieras del Inventario */}
            <div className="p-5 sm:p-6 pb-2 border-b border-white/10 bg-black/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* KPI 1: Productos y Stock */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Productos y Stock</p>
                    <p className="text-2xl font-extrabold text-white mt-0.5">
                      {kpisDetalle.skus} <span className="text-xs font-medium text-zinc-400">SKUs</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                      {kpisDetalle.unidades.toLocaleString('es-CO')} unidades totales
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                {/* KPI 2: Costo Total Inventario */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Costo Total Inventario</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-0.5">
                      ${kpisDetalle.costoTotal.toLocaleString('es-CO')}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">Inversión asentada en stock</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                {/* KPI 3: Valor Total a la Venta */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Valor Total a la Venta</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-0.5">
                      ${kpisDetalle.ventaTotal.toLocaleString('es-CO')}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">Retorno bruto estimado</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                {/* KPI 4: Ganancia Proyectada */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Ganancia Proyectada</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-violet-300 mt-0.5">
                      ${kpisDetalle.ganancia.toLocaleString('es-CO')}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <span className="text-emerald-400 font-bold">{kpisDetalle.margen}% margen</span>
                      <span>•</span>
                      <span>+{kpisDetalle.markup}% markup</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pestañas de Navegación del Modal */}
            <div className="px-5 sm:px-6 pt-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none bg-black/10">
              <button
                onClick={() => setTabRadiografia('inventario')}
                className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
                  tabRadiografia === 'inventario'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Package className="w-4 h-4 text-amber-400" />
                <span>Inventario Completo</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 font-mono text-zinc-300">
                  {inventarioNegocio.length}
                </span>
              </button>

              <button
                onClick={() => setTabRadiografia('ventas')}
                className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
                  tabRadiografia === 'ventas'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Ventas / Actividad</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 font-mono text-zinc-300">
                  {ventasNegocio.length}
                </span>
              </button>

              <button
                onClick={() => setTabRadiografia('vendedores')}
                className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
                  tabRadiografia === 'vendedores'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Vendedores</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 font-mono text-zinc-300">
                  {negocioDetalle.vendedores?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setTabRadiografia('ficha')}
                className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 cursor-pointer ${
                  tabRadiografia === 'ficha'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-4 h-4 text-violet-400" />
                <span>Ficha Técnica (Todo)</span>
              </button>
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {cargandoDetalle ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                  <p className="text-sm font-medium text-zinc-300">Consultando registros en Firestore...</p>
                </div>
              ) : (
                <>
                  {/* ========================================================= */}
                  {/* PESTAÑA 1: INVENTARIO COMPLETO                            */}
                  {/* ========================================================= */}
                  {tabRadiografia === 'inventario' && (
                    <div className="space-y-4">
                      {/* Filtros de Inventario */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar producto por nombre o descripción..."
                            value={busquedaProdModal}
                            onChange={(e) => setBusquedaProdModal(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>

                        {/* Pills de Estado de Stock */}
                        <div className="flex items-center gap-2 overflow-x-auto text-xs">
                          <button
                            onClick={() => setFiltroStockModal('todos')}
                            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                              filtroStockModal === 'todos'
                                ? 'bg-white/15 text-white font-bold'
                                : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Todos ({inventarioNegocio.length})
                          </button>
                          <button
                            onClick={() => setFiltroStockModal('agotado')}
                            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                              filtroStockModal === 'agotado'
                                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                                : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Agotados ({contadoresStock.agotados})
                          </button>
                          <button
                            onClick={() => setFiltroStockModal('bajo')}
                            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                              filtroStockModal === 'bajo'
                                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                                : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            Stock Bajo ({contadoresStock.bajos})
                          </button>
                          <button
                            onClick={() => setFiltroStockModal('normal')}
                            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                              filtroStockModal === 'normal'
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                                : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            En Stock ({contadoresStock.normales})
                          </button>
                        </div>
                      </div>

                      {/* Tabla de Productos */}
                      {productosFiltradosModal.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                          <Package className="w-8 h-8 text-zinc-600 mx-auto" />
                          <p className="text-sm font-bold text-white">No se encontraron productos</p>
                          <p className="text-xs text-zinc-500">
                            No hay productos que coincidan con los filtros o este negocio aún no ha registrado inventario.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-white/[0.04] text-zinc-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="p-3.5">Producto & Descripción</th>
                                <th className="p-3.5 text-center">Stock</th>
                                <th className="p-3.5 text-right">Costo Unit.</th>
                                <th className="p-3.5 text-right">Precio Venta</th>
                                <th className="p-3.5 text-right">Costo Total</th>
                                <th className="p-3.5 text-right">Venta Total</th>
                                <th className="p-3.5 text-right">Margen</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-zinc-300">
                              {productosFiltradosModal.map((prod) => {
                                const stock = Number(prod.stock) || 0;
                                const costo = Number(prod.costo) || 0;
                                const precio = Number(prod.precio_sugerido) || 0;
                                const costoTotalItem = stock * costo;
                                const ventaTotalItem = stock * precio;
                                const margenUnitario = precio - costo;
                                const margenPct = precio > 0 ? Math.round((margenUnitario / precio) * 100) : 0;
                                const expandido = Boolean(descripcionExpandida[prod.id]);

                                return (
                                  <React.Fragment key={prod.id}>
                                    <tr className="hover:bg-white/[0.02] transition-colors">
                                      {/* Producto & Descripción */}
                                      <td className="p-3.5 max-w-xs">
                                        <div className="space-y-1">
                                          <p className="font-bold text-white text-sm">
                                            {prod.nombre || 'Producto sin nombre'}
                                          </p>
                                          {prod.descripcion_visual && (
                                            <div>
                                              <button
                                                onClick={() =>
                                                  setDescripcionExpandida((prev) => ({
                                                    ...prev,
                                                    [prod.id]: !prev[prod.id]
                                                  }))
                                                }
                                                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                              >
                                                <Info className="w-3 h-3" />
                                                <span>{expandido ? 'Ocultar descripción' : 'Ver descripción visual IA'}</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </td>

                                      {/* Stock Badge */}
                                      <td className="p-3.5 text-center whitespace-nowrap">
                                        <span
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                            stock <= 0
                                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                              : stock <= 5
                                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                          }`}
                                        >
                                          {stock <= 0
                                            ? 'Agotado (0)'
                                            : stock <= 5
                                            ? `Bajo (${stock})`
                                            : `En Stock (${stock})`}
                                        </span>
                                      </td>

                                      {/* Costo Unitario */}
                                      <td className="p-3.5 text-right font-mono text-zinc-300 whitespace-nowrap">
                                        ${costo.toLocaleString('es-CO')}
                                      </td>

                                      {/* Precio Venta */}
                                      <td className="p-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                                        ${precio.toLocaleString('es-CO')}
                                      </td>

                                      {/* Costo Total */}
                                      <td className="p-3.5 text-right font-mono text-amber-300 whitespace-nowrap">
                                        ${costoTotalItem.toLocaleString('es-CO')}
                                      </td>

                                      {/* Venta Total */}
                                      <td className="p-3.5 text-right font-mono text-emerald-400 font-bold whitespace-nowrap">
                                        ${ventaTotalItem.toLocaleString('es-CO')}
                                      </td>

                                      {/* Margen */}
                                      <td className="p-3.5 text-right whitespace-nowrap">
                                        <span
                                          className={`font-mono font-semibold ${
                                            margenUnitario >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                          }`}
                                        >
                                          {margenUnitario >= 0 ? '+' : ''}${margenUnitario.toLocaleString('es-CO')}
                                        </span>
                                        <span className="block text-[10px] text-zinc-500">
                                          {margenPct}% margen
                                        </span>
                                      </td>
                                    </tr>

                                    {/* Fila expandible con descripción visual generada por IA */}
                                    {expandido && (
                                      <tr className="bg-indigo-950/20 border-t border-indigo-500/20">
                                        <td colSpan={7} className="p-3.5 text-xs text-indigo-200">
                                          <div className="flex items-start gap-2 max-w-3xl">
                                            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                            <div>
                                              <p className="font-semibold text-white text-[11px] uppercase tracking-wider">
                                                Descripción Visual Detectada por IA:
                                              </p>
                                              <p className="mt-0.5 text-zinc-300 leading-relaxed">
                                                {prod.descripcion_visual}
                                              </p>
                                              {prod.id && (
                                                <p className="mt-1 text-[10px] text-zinc-500 font-mono">
                                                  Doc ID: {prod.id}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* PESTAÑA 2: VENTAS / ACTIVIDAD                             */}
                  {/* ========================================================= */}
                  {tabRadiografia === 'ventas' && (
                    <div className="space-y-4">
                      {/* Buscador de Ventas */}
                      <div className="relative max-w-md">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Buscar en ventas por producto, método o ID..."
                          value={busquedaVentaModal}
                          onChange={(e) => setBusquedaVentaModal(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>

                      {ventasFiltradasModal.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                          <Receipt className="w-8 h-8 text-zinc-600 mx-auto" />
                          <p className="text-sm font-bold text-white">No hay ventas registradas aún</p>
                          <p className="text-xs text-zinc-500 max-w-md mx-auto">
                            Las ventas que el dueño o sus vendedores registren a través de Telegram o WhatsApp aparecerán aquí en tiempo real.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-white/[0.04] text-zinc-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="p-3.5">Fecha y Hora</th>
                                <th className="p-3.5">Producto Vendido</th>
                                <th className="p-3.5 text-center">Cantidad</th>
                                <th className="p-3.5 text-right">Total Venta</th>
                                <th className="p-3.5 text-right">Ganancia Neta</th>
                                <th className="p-3.5">Método / Canal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-zinc-300">
                              {ventasFiltradasModal.map((v) => {
                                const cant = Number(v.cantidad) || 1;
                                const totalVenta =
                                  Number(v.total_venta) || (Number(v.precio_final) || 0) * cant;
                                const ganancia = v.ganancia_neta !== undefined ? Number(v.ganancia_neta) : null;

                                return (
                                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                                    {/* Fecha */}
                                    <td className="p-3.5 font-mono text-zinc-400 whitespace-nowrap">
                                      {formatearFecha(v.fecha_venta || v.fecha)}
                                    </td>

                                    {/* Producto */}
                                    <td className="p-3.5 font-bold text-white">
                                      <div className="flex items-center gap-2">
                                        <span>{v.nombre_producto || 'Producto sin nombre'}</span>
                                        {v.es_venta_fidelizada && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                            CRM Fidelizada
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Cantidad */}
                                    <td className="p-3.5 text-center font-semibold text-white">
                                      {cant} unds
                                    </td>

                                    {/* Total Venta */}
                                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                                      ${totalVenta.toLocaleString('es-CO')} COP
                                    </td>

                                    {/* Ganancia Neta */}
                                    <td className="p-3.5 text-right font-mono whitespace-nowrap">
                                      {ganancia !== null ? (
                                        <span className={ganancia >= 0 ? 'text-emerald-300' : 'text-rose-400'}>
                                          {ganancia >= 0 ? '+' : ''}${ganancia.toLocaleString('es-CO')}
                                        </span>
                                      ) : (
                                        <span className="text-zinc-500">-</span>
                                      )}
                                    </td>

                                    {/* Método / Canal */}
                                    <td className="p-3.5 whitespace-nowrap text-zinc-400">
                                      {v.metodo_pago || (v.es_venta_fidelizada ? 'Tarjeta CRM' : 'Bot POS')}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* PESTAÑA 3: VENDEDORES                                      */}
                  {/* ========================================================= */}
                  {tabRadiografia === 'vendedores' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-3">
                        <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">
                            Vendedores Vinculados al Negocio {negocioDetalle.nombre_negocio}
                          </p>
                          <p className="mt-0.5 text-zinc-300 leading-relaxed">
                            Estos usuarios operan el catálogo y registran ventas usando el inventario compartido de su jefe, pero tienen costos y reportes financieros estrictamente ocultos.
                          </p>
                        </div>
                      </div>

                      {negocioDetalle.vendedores && negocioDetalle.vendedores.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {negocioDetalle.vendedores.map((v) => (
                            <div
                              key={v.id}
                              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Rol: Vendedor
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    v.suscripcion_activa
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      v.suscripcion_activa ? 'bg-emerald-400' : 'bg-rose-400'
                                    }`}
                                  />
                                  <span>{v.suscripcion_activa ? 'Activo' : 'Pausado'}</span>
                                </span>
                              </div>

                              <div className="space-y-1">
                                <p className="font-mono text-sm font-bold text-white flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>{v.id}</span>
                                </p>
                                <p className="text-[11px] text-zinc-400 font-mono">
                                  Negocio vinculador: {v.negocio_id || negocioDetalle.id}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-white/5 flex items-center justify-end">
                                <button
                                  onClick={() => toggleSuscripcionVendedor(v.id, v.suscripcion_activa)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    v.suscripcion_activa
                                      ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                                  }`}
                                >
                                  {v.suscripcion_activa ? 'Pausar Vendedor' : 'Activar Vendedor'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                          <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                          <h4 className="text-sm font-bold text-white">No hay vendedores asignados</h4>
                          <p className="text-xs text-zinc-500 max-w-md mx-auto">
                            Para vincular un vendedor a este negocio, dile al vendedor que inicie el bot y luego ejecuta como Super Admin en Telegram:
                          </p>
                          <code className="inline-block px-3 py-1.5 rounded-xl bg-black/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                            /aprobar [ID_VENDEDOR] vendedor {negocioDetalle.id}
                          </code>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* PESTAÑA 4: FICHA TÉCNICA (TODO)                            */}
                  {/* ========================================================= */}
                  {tabRadiografia === 'ficha' && (
                    <div className="space-y-6">
                      {/* Cuadrícula de Propiedades Técnicas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">ID Documento (Chat ID)</p>
                          <p className="text-xs font-mono font-bold text-white">{negocioDetalle.id}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Nombre del Negocio</p>
                          <p className="text-xs font-bold text-white">{negocioDetalle.nombre_negocio || 'Sin Nombre'}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Plan Contratado</p>
                          <p className="text-xs font-bold text-indigo-300">{negocioDetalle.plan || 'Negocio Pro'}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Estado de Suscripción</p>
                          <p className={`text-xs font-bold ${negocioDetalle.suscripcion_activa ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {negocioDetalle.suscripcion_activa ? 'Activa' : 'Pausada / Pendiente'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Meses Consecutivos</p>
                          <p className="text-xs font-bold text-white">{negocioDetalle.meses_consecutivos || 1} mes(es)</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Negocio ID (Tenant Root)</p>
                          <p className="text-xs font-mono text-zinc-300">{negocioDetalle.negocio_id || negocioDetalle.id}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Fecha de Aprobación</p>
                          <p className="text-xs font-mono text-zinc-300">{formatearFecha(negocioDetalle.fecha_aprobacion)}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Última Actualización</p>
                          <p className="text-xs font-mono text-zinc-300">{formatearFecha(negocioDetalle.fecha_actualizacion)}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Transacción Wompi / Ref</p>
                          <p className="text-xs font-mono text-zinc-300">
                            {negocioDetalle.wompi_tx_id || negocioDetalle.referencia_wompi || 'No registrada / Manual'}
                          </p>
                        </div>
                      </div>

                      {/* Visor de JSON Raw */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Documento Firestore Crudo (clientes_saas/{negocioDetalle.id})</span>
                          </p>
                          <button
                            onClick={() => copiarJsonFicha(negocioDetalle)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {copiadoJson ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar JSON</span>
                              </>
                            )}
                          </button>
                        </div>

                        <pre className="p-4 rounded-2xl bg-black/70 border border-white/10 font-mono text-xs text-indigo-200 overflow-x-auto max-h-80 selection:bg-indigo-500 selection:text-white">
                          {JSON.stringify(negocioDetalle, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDICIÓN RÁPIDA (PLAN Y MESES)                                    */}
      {/* ========================================================================= */}
      {clienteEditando && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card bg-[#0b0b12] rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Editar Inquilino SaaS</h3>
                <p className="text-xs text-zinc-400">ID: {clienteEditando.id}</p>
              </div>
              <button
                onClick={() => setClienteEditando(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre de Negocio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Nombre del Negocio</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Ej. Boutique Sofilú"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Plan Activo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Plan de Suscripción</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Emprendedor">Plan Emprendedor ($39.000 COP)</option>
                  <option value="Negocio Pro">Plan Negocio Pro ($79.000 COP)</option>
                  <option value="Multi-Sede">Plan Multi-Sede ($149.000 COP)</option>
                  <option value="Personalizado">Plan Especial / Personalizado</option>
                </select>
              </div>

              {/* Meses Consecutivos */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Meses Pagando de Corrido
                </label>
                <input
                  type="number"
                  min="1"
                  value={editMeses}
                  onChange={(e) => setEditMeses(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-zinc-500">
                  Utilizado para premiar la lealtad y calcular estadísticas de recurrencia.
                </p>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClienteEditando(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoEdicion}
                onClick={guardarEdicionCliente}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
              >
                {guardandoEdicion ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
