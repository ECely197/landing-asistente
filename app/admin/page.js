'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  auth,
  db
} from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  updateDoc
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
  AlertCircle
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

  // Acordeón de Vendedores expandidos por ID de negocio
  const [vendedoresExpandidos, setVendedoresExpandidos] = useState({});

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

  const mostrarToast = (msg) => {
    setToastMensaje(msg);
    setTimeout(() => {
      setToastMensaje(null);
    }, 4000);
  };

  // Función para consultar Firestore
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
        const valorItem = stock * costo;

        granTotalValor += valorItem;
        granTotalProds += 1;

        if (!mapaInventarioPorCliente[clienteId]) {
          mapaInventarioPorCliente[clienteId] = {
            totalProductos: 0,
            totalUnidades: 0,
            valorTotalInventario: 0
          };
        }

        mapaInventarioPorCliente[clienteId].totalProductos += 1;
        mapaInventarioPorCliente[clienteId].totalUnidades += stock;
        mapaInventarioPorCliente[clienteId].valorTotalInventario += valorItem;
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
          valorTotalInventario: 0
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

  // Toggle rápido de Suscripción Activa
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

  // Filtrado de Negocios
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

  // Métricas Consolidadas
  const totalNegocios = negocios.length;
  const suscripcionesActivas = negocios.filter((n) => n.suscripcion_activa === true).length;
  const totalVendedoresCount = vendedoresTotales.length;

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
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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
              className="p-2.5 rounded-xl glass-card text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 text-xs font-semibold"
              title="Actualizar Datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-2 text-xs font-semibold"
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
                Administra el estado de suscripción, asigna planes y supervisa los vendedores por negocio.
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
                      <div className="space-y-1.5 flex-1">
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

                        {/* Subdata: ID, Teléfono, Meses de Pago */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span>ID: {cliente.id}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Tiempo de corrido: {cliente.meses_consecutivos} mes(es)</span>
                          </div>

                          <div className="flex items-center gap-1 text-zinc-300 font-sans">
                            <Package className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {cliente.inventario.totalProductos} prods (${cliente.inventario.valorTotalInventario.toLocaleString('es-CO')} COP)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de Acción Rápida */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                        {/* Switch de Activación Instantánea */}
                        <button
                          onClick={() => toggleSuscripcion(cliente.id, estaActivo)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
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
                          className="px-3 py-2 rounded-xl glass-card text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all text-xs font-medium flex items-center gap-1.5"
                          title="Editar Plan y Detalles"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        {/* Botón Desplegar Vendedores */}
                        <button
                          onClick={() => toggleVendedores(cliente.id)}
                          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5 border border-white/10 transition-all"
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Vendedores ({cliente.vendedores?.length || 0})</span>
                          {estaExpandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Desplegable de Vendedores Vinculados */}
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
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
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
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoEdicion}
                onClick={guardarEdicionCliente}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
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
