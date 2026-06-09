import { NextRequest, NextResponse } from 'next/server'

// GET /api/auth/meta/exchange-token?short_token=EAAMCpg...
// Troca o short-lived Page Access Token por um long-lived (válido 60 dias)
export async function GET(request: NextRequest) {
  const shortToken = request.nextUrl.searchParams.get('short_token')

  if (!shortToken) {
    return NextResponse.json({ error: 'short_token é obrigatório' }, { status: 400 })
  }

  const appId     = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!

  try {
    // Passo 1: Trocar short-lived user token por long-lived user token
    const userTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
    const userTokenRes = await fetch(userTokenUrl)
    const userTokenData = await userTokenRes.json()

    if (userTokenData.error) {
      return NextResponse.json({
        error: 'Falha ao trocar user token',
        details: userTokenData.error
      }, { status: 400 })
    }

    const longLivedUserToken = userTokenData.access_token

    // Passo 2: Buscar Page Access Token de longa duração da página Alvorada Imóveis JP
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedUserToken}`
    const pagesRes = await fetch(pagesUrl)
    const pagesData = await pagesRes.json()

    if (pagesData.error) {
      return NextResponse.json({
        error: 'Falha ao buscar páginas',
        details: pagesData.error
      }, { status: 400 })
    }

    // Retornar todas as páginas com seus tokens de longa duração
    const pages = (pagesData.data ?? []).map((page: {
      id: string
      name: string
      access_token: string
      category: string
    }) => ({
      id: page.id,
      name: page.name,
      category: page.category,
      long_lived_token: page.access_token,
    }))

    return NextResponse.json({
      message: 'Tokens de longa duração gerados com sucesso (válidos por 60 dias)',
      long_lived_user_token: longLivedUserToken,
      pages,
    })

  } catch (error) {
    console.error('[Exchange Token] Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
