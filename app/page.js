'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  MessageSquare,
  Sparkles,
  BarChart3,
  QrCode,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Mic,
  Camera,
  Layers,
  Users,
  ChevronDown,
  Menu,
  X,
  CreditCard,
  Lock,
  Smartphone
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const numeroSoporte = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '573001234567';

  const generarLinkWpp = (plan) => {
    const texto = encodeURIComponent(
      `👋 ¡Hola! Estoy interesado en activar el plan *${plan}* de Sofilú AI para mi negocio. ¿Me podrías dar los pasos de activación?`
    );
    return `https://wa.me/${numeroSoporte}?text=${texto}`;
  };

  const faqs = [
    {
      q: '¿Necesito instalar algún software o app pesada en mi celular o PC?',
      a: '¡Absolutamente nada! Sofilú AI funciona 100% dentro de tu aplicación de Telegram o WhatsApp. No requieres servidores, descargas ni computadores especiales.'
    },
    {
      q: '¿Mis vendedores pueden ver cuánto me cuesta la mercancía o mis balances?',
      a: 'No. El sistema cuenta con un Firewall de Permisos Estricto. Los vendedores solo pueden consultar existencias, registrar ventas y fidelizar clientes. Los costos de compra, márgenes de ganancia y reportes financieros están completamente bloqueados para ellos.'
    },
    {
      q: '¿Cómo entiende la IA las ventas por nota de voz?',
      a: 'Utilizamos modelos de voz y visión de última generación (Whisper y LLMs avanzados). Puedes hablarle de manera natural: "Vendí 2 vestidos negros a 60 mil cada uno y una blusa blanca a 35 mil". La IA detecta los productos, descuenta el stock y calcula tu rentabilidad en segundos.'
    },
    {
      q: '¿Cómo funciona el pago y cuánto tarda la activación?',
      a: 'Aceptamos transferencias por Wompi, Nequi, Daviplata o PSE. Una vez recibido el comprobante, el Super Administrador activa tu cuenta de inmediato y tu bot queda listo para operar.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-600/15 via-violet-600/15 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-[40%] -left-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[160px]" />
        <div className="absolute top-[75%] -right-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px]" />
      </div>

      {/* ========================================================================= */}
      {/* 1. NAVBAR                                                                 */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/15 transition-transform duration-300 group-hover:scale-105">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">Sofilú</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI ERP
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide">POS Inteligente</p>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
            <a href="#funciones" className="hover:text-white transition-colors">
              Funciones
            </a>
            <a href="#como-funciona" className="hover:text-white transition-colors">
              Cómo Funciona
            </a>
            <a href="#planes" className="hover:text-white transition-colors">
              Planes y Precios
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              Preguntas
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
              title="Panel de Super Administrador"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Acceso Admin</span>
            </Link>

            <a
              href="#planes"
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Empezar Ahora</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/admin"
              className="p-2 text-zinc-400 hover:text-white rounded-lg border border-white/10"
              title="Acceso Admin"
            >
              <Lock className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg border border-white/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-nav border-t border-white/10 px-4 pt-4 pb-6 space-y-3">
            <a
              href="#funciones"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-zinc-300 hover:text-white"
            >
              Funciones
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-zinc-300 hover:text-white"
            >
              Cómo Funciona
            </a>
            <a
              href="#planes"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-zinc-300 hover:text-white"
            >
              Planes y Precios
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-zinc-300 hover:text-white"
            >
              Preguntas
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="#planes"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm"
              >
                Ver Planes y Precios
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative z-10 pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-white/10 text-xs font-semibold text-indigo-300 shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>El ERP con Inteligencia Artificial que vive en tu chat</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-gradient">
            Tu negocio bajo control directo en WhatsApp y Telegram.
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Olvídate de sistemas engorrosos y hojas de cálculo. Registra ventas por{' '}
            <span className="text-zinc-200 font-semibold">notas de voz</span> o{' '}
            <span className="text-zinc-200 font-semibold">fotos</span>, controla tu inventario al instante, genera{' '}
            <span className="text-zinc-200 font-semibold">dashboards visuales</span> y fideliza clientes con tarjetas QR.
          </p>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#planes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Ver Planes Disponibles</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={generarLinkWpp('Consulta General')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl glass-card glass-card-hover text-zinc-200 font-semibold text-base"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Hablar con un Asesor</span>
            </a>
          </div>

          {/* Micro trust indicators */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Configuración en 2 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Seguridad y roles blindados</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>0 aplicaciones pesadas</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Mockup / Glass Window */}
        <div className="mt-16 max-w-4xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-white/15 via-white/5 to-transparent shadow-2xl">
          <div className="glass-card rounded-[23px] p-6 sm:p-8 space-y-6">
            {/* Window Topbar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs text-zinc-400 font-mono">Chat en Vivo con Sofilú AI</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>IA Conectada</span>
              </div>
            </div>

            {/* Chat Interaction Simulation */}
            <div className="space-y-4 text-sm font-sans">
              {/* User Voice Message */}
              <div className="flex items-end justify-end gap-3">
                <div className="max-w-md rounded-2xl rounded-tr-sm p-4 bg-indigo-600 text-white shadow-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Mic className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-3/4 rounded-full" />
                      </div>
                      <p className="text-[10px] text-indigo-200 mt-1">0:06 • Nota de voz</p>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-100 italic">
                    &quot;Vendí 2 vestidos de seda a 60 mil cada uno y una blusa blanca a 35 mil.&quot;
                  </p>
                </div>
              </div>

              {/* Bot Answer */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="max-w-lg rounded-2xl rounded-tl-sm p-4 glass-card border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4" /> Venta Registrada con Éxito
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">11:42 AM</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-3 rounded-xl border border-white/5">
                    <div>
                      <p className="text-zinc-500">Total Venta</p>
                      <p className="text-base font-bold text-white">$155.000 COP</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Ganancia Neta</p>
                      <p className="text-base font-bold text-emerald-400">+$62.000 COP</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300">
                    📦 <strong>Stock actualizado:</strong> Vestido Seda (-2 unid, quedan 5) | Blusa Blanca (-1 unid, quedan 12).
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                      📊 Reporte BI HTML generado
                    </span>
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                      💳 Puntos CRM sumados
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BENTO GRID FEATURES                                                    */}
      {/* ========================================================================= */}
      <section id="funciones" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Poder Sin Complicaciones
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Todo lo que tu comercio necesita para crecer.
          </h3>
          <p className="text-zinc-400 text-base sm:text-lg">
            Diseñado para que tú y tu equipo dediquen tiempo a vender, no a pelear con computadores.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Inventario por Voz/Foto (Span 2) */}
          <div className="lg:col-span-2 glass-card glass-card-hover rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Mic className="w-6 h-6" />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Camera className="w-6 h-6" />
                </div>
              </div>

              <h4 className="text-2xl font-bold text-white tracking-tight">
                1. Inventario y Ventas por Voz o Foto
              </h4>

              <p className="text-zinc-400 leading-relaxed text-sm sm:text-base">
                Dile adiós a digitar códigos de barras o llevar cuadernos que se pierden. Envía una foto
                del producto nuevo o una nota de voz como <em>&quot;vendí 3 vestidos rojos a 45 mil&quot;</em>.
                Sofilú descuenta las unidades, calcula los costos de compra y asienta tu ganancia real al instante.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono">
                🎙️ Whisper Audio AI
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono">
                📷 Computer Vision
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-mono">
                💰 Cálculo de Ganancia Neta
              </span>
            </div>
          </div>

          {/* Card 2: Inteligencia de Negocio (BI) */}
          <div className="glass-card glass-card-hover rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <BarChart3 className="w-6 h-6" />
              </div>

              <h4 className="text-2xl font-bold text-white tracking-tight">
                2. Dashboards BI en HTML
              </h4>

              <p className="text-zinc-400 leading-relaxed text-sm">
                NUNCA respondemos balances aburridos en texto plano. Pide tu balance y recibe un archivo HTML
                con gráficos interactivos, alertas de margen bajo y recomendaciones inteligentes de reinversión.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Margen promedio</span>
                  <span className="text-emerald-400 font-bold">42.8%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-3/4" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: CRM Fidelización con Códigos QR */}
          <div className="glass-card glass-card-hover rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <QrCode className="w-6 h-6" />
              </div>

              <h4 className="text-2xl font-bold text-white tracking-tight">
                3. Tarjetas QR y Fidelización
              </h4>

              <p className="text-zinc-400 leading-relaxed text-sm">
                Registra clientes en segundos y genérales tarjetas con código QR único. Al momento de la
                compra, envía la foto del QR y la IA acumulará puntos, premiando a tus clientes más fieles.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center p-2 border border-white/10">
                <QrCode className="w-full h-full text-indigo-300" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Tarjeta Digital C-10492</p>
                <p className="text-zinc-400">12 compras acumuladas</p>
              </div>
            </div>
          </div>

          {/* Card 4: Control de Roles Blindado (Span 2) */}
          <div className="lg:col-span-2 glass-card glass-card-hover rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-500/20 transition-all" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <h4 className="text-2xl font-bold text-white tracking-tight">
                4. Control de Roles: Dueño vs. Vendedores
              </h4>

              <p className="text-zinc-400 leading-relaxed text-sm sm:text-base">
                Tus vendedores operan el punto de venta, consultan stock y cobran a los clientes desde sus
                propios números de WhatsApp o Telegram, pero tienen{' '}
                <span className="text-white font-bold underline decoration-rose-500">
                  estrictamente prohibido
                </span>{' '}
                ver costos de adquisición de mercancía, balances o márgenes de ganancia. Tu secreto comercial
                está 100% blindado.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <div>
                  <p className="font-bold text-white">Rol Dueño</p>
                  <p className="text-zinc-400 text-[11px]">Acceso a costos, inventario y reportes BI</p>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <div>
                  <p className="font-bold text-white">Rol Vendedor</p>
                  <p className="text-zinc-400 text-[11px]">Solo venta y stock (Costos ocultos)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CÓMO FUNCIONA                                                          */}
      {/* ========================================================================= */}
      <section id="como-funciona" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Simplicidad Radical
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Comienza a operar en 3 sencillos pasos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card rounded-3xl p-8 space-y-4 relative">
            <span className="text-4xl font-extrabold text-white/20 font-mono">01</span>
            <h4 className="text-xl font-bold text-white">Elige tu Plan y Activa</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Selecciona el plan que se adapte al tamaño de tu tienda. Realiza tu pago por Wompi, Nequi o transferencia bancaria.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 space-y-4 relative">
            <span className="text-4xl font-extrabold text-indigo-500/40 font-mono">02</span>
            <h4 className="text-xl font-bold text-white">Vincula tu WhatsApp o Telegram</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              El Super Administrador autoriza tu número de teléfono. Al instante recibirás la bienvenida de tu Asistente IA.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 space-y-4 relative">
            <span className="text-4xl font-extrabold text-emerald-500/40 font-mono">03</span>
            <h4 className="text-xl font-bold text-white">Chatea y Empieza a Vender</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Manda audios con tus ventas, toma fotos de tu mercancía y pídele balances semanales. ¡Tu negocio en piloto automático!
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PRICING SECTION                                                        */}
      {/* ========================================================================= */}
      <section id="planes" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Planes Transparentes
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Inversión pequeña, retorno gigante
          </h3>
          <p className="text-zinc-400 text-base sm:text-lg">
            Sin contratos de permanencia. Cancela o cambia de plan cuando quieras.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Plan 1: Emprendedor */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border-white/10 hover:border-white/20 transition-all">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold text-white">Emprendedor</h4>
                <p className="text-xs text-zinc-400 mt-1">Ideal para comercios unipersonales que arrancan.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$39.000</span>
                <span className="text-xs text-zinc-400 font-medium">COP / mes</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 Cuenta de Dueño (Telegram o WhatsApp)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Registro de inventario ilimitado por voz y foto</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cálculo automático de costos y ganancia neta</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dashboards semanales de ventas en HTML</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Soporte estándar por chat</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <a
                href={generarLinkWpp('Emprendedor')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl glass-card glass-card-hover text-white font-semibold text-sm"
              >
                <span>Elegir Plan Emprendedor</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Plan 2: Negocio Pro (Destacado) */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border-indigo-500/40 relative shadow-2xl shadow-indigo-600/20 bg-gradient-to-b from-indigo-950/30 via-black/60 to-black/80 scale-[1.02]">
            {/* Pill Destacado */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-[11px] shadow-md uppercase tracking-wider">
              Más Popular 🔥
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Negocio Pro</span>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </h4>
                <p className="text-xs text-zinc-400 mt-1">Para negocios con vendedores y alto flujo de pedidos.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-white">$79.000</span>
                <span className="text-xs text-zinc-400 font-medium">COP / mes</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-zinc-200">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-white">Todo lo del Plan Emprendedor</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Hasta 3 Vendedores vinculados (Roles aislados)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Módulo CRM: Tarjetas digitales de fidelización QR</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Escaneo automático de QR desde fotos enviadas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Reportes BI interactivos en tiempo real</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Soporte prioritario VIP por WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <a
                href={generarLinkWpp('Negocio Pro')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Activar Plan Negocio Pro</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Plan 3: Multi-Sede / Franquicia */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border-white/10 hover:border-white/20 transition-all">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold text-white">Multi-Sede</h4>
                <p className="text-xs text-zinc-400 mt-1">Para cadenas, franquicias o múltiples puntos de venta.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$149.000</span>
                <span className="text-xs text-zinc-400 font-medium">COP / mes</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">Todo lo del Plan Negocio Pro</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Vendedores ilimitados y múltiples locales</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Facturación B2B visual con liquidación por video</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Auditorías cruzadas y exportación de base de datos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Onboarding 1 a 1 y acompañamiento dedicado</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <a
                href={generarLinkWpp('Multi-Sede')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl glass-card glass-card-hover text-white font-semibold text-sm"
              >
                <span>Elegir Plan Multi-Sede</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PREGUNTAS FRECUENTES (FAQ)                                             */}
      {/* ========================================================================= */}
      <section id="faq" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-white/5">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Dudas Comunes
          </h2>
          <h3 className="text-3xl font-extrabold text-white">Preguntas Frecuentes</h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl overflow-hidden border border-white/10 transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-6 flex items-center justify-between gap-4 font-semibold text-base text-zinc-100 hover:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${
                    openFaq === idx ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-white/10 bg-black/60 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Sofilú AI</p>
              <p className="text-[11px] text-zinc-500">ERP & POS por Telegram y WhatsApp</p>
            </div>
          </div>

          <p className="text-xs text-zinc-500 text-center sm:text-left">
            © 2026 Sofilú AI. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <a href="#funciones" className="hover:text-white transition-colors">
              Funciones
            </a>
            <a href="#planes" className="hover:text-white transition-colors">
              Planes
            </a>
            <Link href="/admin" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
