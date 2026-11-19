import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';

// Helper para extraer propiedades anidadas como "transaction.id" de data
function getNestedValue(obj: any, path: string): string {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return '';
    current = current[part];
  }
  return current !== undefined && current !== null ? String(current) : '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, data, signature, timestamp } = body;

    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
    if (!eventsSecret) {
      console.error('❌ [Wompi Webhook] WOMPI_EVENTS_SECRET no configurado en el servidor');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // 1. Validar la firma de seguridad (signature.checksum)
    if (!signature || !signature.checksum || !Array.isArray(signature.properties)) {
      console.error('❌ [Wompi Webhook] Estructura de firma incompleta en payload');
      return NextResponse.json({ error: 'Firma incompleta' }, { status: 401 });
    }

    let concatenated = '';
    for (const prop of signature.properties) {
      concatenated += getNestedValue(data, prop);
    }
    concatenated += String(timestamp !== undefined && timestamp !== null ? timestamp : '');
    concatenated += eventsSecret;

    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(concatenated)
      .digest('hex');

    if (calculatedChecksum.toLowerCase() !== String(signature.checksum).toLowerCase()) {
      console.error('❌ [Wompi Webhook] Firma de seguridad inválida:', {
        calculada: calculatedChecksum,
        recibida: signature.checksum,
      });
      return NextResponse.json({ error: 'Firma de seguridad inválida' }, { status: 401 });
    }

    // 2. Procesar evento de actualización de transacción
    if (event === 'transaction.updated') {
      const transaction = data?.transaction;
      const txStatus = transaction?.status;
      const reference = transaction?.reference || '';
      const txId = transaction?.id;

      console.log(`🔔 [Wompi Webhook] Evento transaction.updated recibido - ID: ${txId}, Estado: ${txStatus}, Ref: ${reference}`);

      if (txStatus === 'APPROVED') {
        // Extrae chatId y plan haciendo .split('-') sobre reference
        // Formato esperado: SOFILU-${chatId}-${plan}-${timestamp}
        const parts = reference.split('-');
        const chatId = parts[1];
        const rawPlan = parts[2] || 'Negocio Pro';
        const plan = rawPlan.replace(/_/g, ' ');

        if (!chatId) {
          console.warn(`⚠️ [Wompi Webhook] No se pudo extraer chatId de la referencia: "${reference}"`);
          return NextResponse.json({ error: 'Referencia sin chatId identificable' }, { status: 400 });
        }

        // Actualizar en Firestore colección clientes_saas/${chatId}
        await adminDb.collection('clientes_saas').doc(String(chatId)).set(
          {
            suscripcion_activa: true,
            rol: 'dueno',
            negocio_id: String(chatId),
            plan: plan,
            estado: 'activo',
            fecha_ultimo_pago: new Date(),
            wompi_tx_id: txId,
          },
          { merge: true }
        );

        console.log(`🎉 [Wompi Webhook] Suscripción activada exitosamente para cliente ${chatId} con plan "${plan}" (TX: ${txId})`);
      } else {
        console.log(`ℹ️ [Wompi Webhook] Transacción ${txId} con estado no aprobado: ${txStatus}`);
      }
    }

    return NextResponse.json({ status: 'ok', received: true }, { status: 200 });
  } catch (err: any) {
    console.error('❌ [Wompi Webhook] Error procesando webhook:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno en webhook' },
      { status: 500 }
    );
  }
}
