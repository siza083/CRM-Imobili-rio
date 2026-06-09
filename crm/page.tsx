import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from './components/KanbanBoard'
import type { Lead } from './components/KanbanCard'

export const dynamic = 'force-dynamic'

export default async function CRMPage() {
  const supabase = await createClient()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, meta_lead_id, nome, email, telefone, status, criado_em')
    .order('criado_em', { ascending: false })

  if (error) {
    console.error('[CRM] Erro ao buscar leads:', error)
  }

  return <KanbanBoard initialLeads={(leads ?? []) as Lead[]} />
}
