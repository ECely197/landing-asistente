import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, negocioNombre, plan, precioCOP } = body;

    if (!chatId || !precioCOP || !plan) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (chatId, plan, precioCOP)' },
        { status: 400 }
      );
    }

    // Limpia chatId (solo números)
    const chatIdClean = String(chatId).replace(/\D/g, '');
    if (!chatIdClean) {
      return NextResponse.json(
        { error: 'El chatId o número telefónico no contiene dígitos válidos' },
        { status: 400 }
      );
    }

    // Limpia el nombre del plan para la referencia (evita espacios problemáticos)
    const planClean = String(plan).trim().replace(/\s+/g, '_');

    // Genera una referencia única con formato: SOFILU-${chatId}-${plan}-${Date.now()}
    const reference = `SOFILU-${chatIdClean}-${planClean}-${Date.now()}`;

    // Convierte precioCOP a centavos
    const amountInCents = Math.round(Number(precioCOP) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      return NextResponse.json(
        { error: 'El precio en COP no es un valor numérico válido' },
        { status: 400 }
      );
    }

    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
    if (!integritySecret) {
      console.error('❌ [Wompi Sign] WOMPI_INTEGRITY_SECRET no está configurado en las variables de entorno');
      return NextResponse.json(
        { error: 'Error de configuración del servidor (falta WOMPI_INTEGRITY_SECRET)' },
        { status: 500 }
      );
    }

    // Genera la firma SHA-256 concatenando exactamente: ${reference}${amountInCents}COP${process.env.WOMPI_INTEGRITY_SECRET}
    const stringToSign = `${reference}${amountInCents}COP${integritySecret}`;
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex');

    console.log(`🔐 [Wompi Sign] Firma generada para ${chatIdClean} (${negocioNombre || 'Sin nombre'}), Ref: ${reference}, Monto: $${precioCOP} COP (${amountInCents} centavos)`);

    return NextResponse.json({
      reference,
      amountInCents,
      currency: 'COP',
      signature,
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
    });
  } catch (err: any) {
    console.error('❌ [Wompi Sign] Error generando firma:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno al procesar la firma' },
      { status: 500 }
    );
  }
}
