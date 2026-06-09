import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Busca leads inseridos nos últimos 2 minutos
  const desde = new Date(Date.now() - 2 * 60 * 1000).toISOString()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .gte('criado_em', desde)
    .order('criado_em', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ leads: leads ?? [] })
}
