import { NextRequest, NextResponse } from 'next/server'

// GET /api/auth/meta/exchange-token?page_token=EAAMCpg...
// Troca o short-lived Page Access Token por um long-lived (válido 60 dias)
export async function GET(request: NextRequest) {
  const pageToken = request.nextUrl.searchParams.get('page_token')
  const shortToken = request.nextUrl.searchParams.get('short_token')
  const token = pageToken || shortToken

  if (!token) {
    return NextResponse.json({ error: 'page_token é obrigatório' }, { status: 400 })
  }

  const appId     = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!

  try {
    // Trocar o Page Token por um Long-Lived Page Token diretamente
    const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      return NextResponse.json({
        error: 'Falha ao trocar token',
        details: data.error
      }, { status: 400 })
    }

    const longLivedToken = data.access_token
    const expiresIn = data.expires_in

    // Verificar info do token
    const debugUrl = `https://graph.facebook.com/v19.0/me?access_token=${longLivedToken}&fields=id,name`
    const debugRes = await fetch(debugUrl)
    const debugData = await debugRes.json()

    return NextResponse.json({
      message: 'Long-Lived Token gerado com sucesso',
      long_lived_page_token: longLivedToken,
      expires_in_seconds: expiresIn,
      page: debugData,
    })

  } catch (error) {
    console.error('[Exchange Token] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
