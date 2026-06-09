'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { KanbanCard, type Lead } from './KanbanCard'
import { logout } from '@/app/login/actions'

type Column = {
  id: Lead['status']
  label: string
  color: string
  dot: string
}

const COLUMNS: Column[] = [
  { id: 'novo',        label: 'Novo',        color: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500' },
  { id: 'em_contato',  label: 'Em contato',  color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  { id: 'qualificado', label: 'Qualificado', color: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  { id: 'convertido',  label: 'Convertido',  color: 'bg-green-50 border-green-200',   dot: 'bg-green-500' },
  { id: 'descartado',  label: 'Descartado',  color: 'bg-gray-50 border-gray-200',     dot: 'bg-gray-400' },
]

type Props = {
  initialLeads: Lead[]
}

type Notificacao = {
  id: string
  nome: string | null
}

export function KanbanBoard({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])

  const dismissNotificacao = useCallback((id: string) => {
    setNotificacoes(prev => prev.filter(n => n.id !== id))
  }, [])

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => {
          const novoLead = payload.new as Lead
          // Adiciona ao estado
          setLeads(prev => {
            if (prev.find(l => l.id === novoLead.id)) return prev
            return [novoLead, ...prev]
          })
          // Exibe notificação
          setNotificacoes(prev => [...prev, { id: novoLead.id, nome: novoLead.nome }])
          // Remove notificação automaticamente após 6s
          setTimeout(() => dismissNotificacao(novoLead.id), 6000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dismissNotificacao])

  const filtered = leads.filter(lead => {
    const q = search.toLowerCase()
    return (
      lead.nome?.toLowerCase().includes(q) ||
      lead.telefone?.includes(q) ||
      lead.email?.toLowerCase().includes(q)
    )
  })

  const handleStatusChange = async (id: string, status: Lead['status']) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      }
    } finally {
      setUpdating(null)
    }
  }

  const totalPorStatus = (status: Lead['status']) =>
    filtered.filter(l => l.status === status).length

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Notificações de novos leads */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notificacoes.map(n => (
          <div
            key={n.id}
            className="flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-xl px-4 py-3 text-sm animate-pulse"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-gray-800 font-medium">
              Novo lead: <span className="text-green-700">{n.nome ?? 'Sem nome'}</span>
            </span>
            <button
              onClick={() => dismissNotificacao(n.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">CRM Imobiliário</h1>
            <p className="text-sm text-gray-500">{leads.length} lead{leads.length !== 1 ? 's' : ''} no total</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="max-w-screen-2xl mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {COLUMNS.map(col => {
            const colLeads = filtered.filter(l => l.status === col.id)
            return (
              <div key={col.id} className={`rounded-xl border ${col.color} p-3 flex flex-col gap-2 min-h-[200px]`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  <span className="ml-auto bg-white text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200">
                    {totalPorStatus(col.id)}
                  </span>
                </div>

                {colLeads.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center mt-4">Nenhum lead</p>
                ) : (
                  colLeads.map(lead => (
                    <div key={lead.id} className={updating === lead.id ? 'opacity-50 pointer-events-none' : ''}>
                      <KanbanCard lead={lead} onStatusChange={handleStatusChange} />
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && search && (
          <p className="text-center text-gray-400 mt-12 text-sm">Nenhum lead encontrado para "{search}"</p>
        )}
      </div>
    </div>
  )
}
