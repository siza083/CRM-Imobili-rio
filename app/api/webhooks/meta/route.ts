import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── GET: Verificação do webhook pelo Meta ───────────────────────────────────
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('[Webhook Meta] Verificação bem-sucedida')
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn('[Webhook Meta] Falha na verificação — token inválido')
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ─── POST: Recebimento de leads em tempo real ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Validar assinatura HMAC do Meta
    const signature = request.headers.get('x-hub-signature-256')
    if (!signature) {
      console.warn('[Webhook Meta] Requisição sem assinatura')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.text()

    const isValid = await validateSignature(rawBody, signature)
    if (!isValid) {
      console.warn('[Webhook Meta] Assinatura inválida')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

    // O Meta envia um array de "entry", cada um com "changes"
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === 'leadgen') {
          await processLead(change.value)
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('[Webhook Meta] Erro ao processar payload:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// ─── Validação HMAC-SHA256 ───────────────────────────────────────────────────
async function validateSignature(body: string, signature: string): Promise<boolean> {
  try {
    const appSecret = process.env.META_APP_SECRET!
    const encoder   = new TextEncoder()

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const sigHex    = 'sha256=' + Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return sigHex === signature
  } catch {
    return false
  }
}

// ─── Processamento e salvamento do lead ─────────────────────────────────────
async function processLead(value: {
  leadgen_id: string
  page_id: string
  form_id: string
  ad_id?: string
  adgroup_id?: string
  created_time: number
}) {
  const supabase = await createClient()

  // Buscar dados completos do lead na Graph API
  const leadData = await fetchLeadFromMeta(value.leadgen_id)
  if (!leadData) {
    console.error('[Webhook Meta] Não foi possível buscar lead:', value.leadgen_id)
    return
  }

  // Mapear campos do formulário de lead
  const fields: Record<string, string> = {}
  for (const f of leadData.field_data ?? []) {
    fields[f.name] = Array.isArray(f.values) ? f.values[0] : f.values
  }

  // Salvar no Supabase
  const { error } = await supabase.from('leads').insert({
    meta_lead_id:   value.leadgen_id,
    meta_page_id:   value.page_id,
    meta_form_id:   value.form_id,
    meta_ad_id:     value.ad_id ?? null,
    meta_adset_id:  value.adgroup_id ?? null,
    nome:           fields['full_name'] ?? fields['nome'] ?? null,
    email:          fields['email'] ?? null,
    telefone:       fields['phone_number'] ?? fields['telefone'] ?? null,
    raw_fields:     fields,
    status:         'novo',
    criado_em:      new Date(value.created_time * 1000).toISOString(),
  })

  if (error) {
    console.error('[Webhook Meta] Erro ao salvar lead no Supabase:', error)
    throw error
  }

  console.log('[Webhook Meta] Lead salvo com sucesso:', value.leadgen_id)
}

// ─── Busca lead completo na Graph API do Meta ────────────────────────────────
async function fetchLeadFromMeta(leadgenId: string) {
  try {
    const url = `https://graph.facebook.com/v19.0/${leadgenId}?fields=field_data,created_time&access_token=${process.env.META_PAGE_ACCESS_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) {
      console.error('[Meta Graph API] Status:', res.status)
      return null
    }
    return res.json()
  } catch (error) {
    console.error('[Meta Graph API] Erro na requisição:', error)
    return null
  }
}
