'use client'

import { useState } from 'react'

export type Lead = {
  id: string
  meta_lead_id: string
  nome: string | null
  email: string | null
  telefone: string | null
  status: 'novo' | 'em_contato' | 'qualificado' | 'descartado' | 'convertido'
  criado_em: string
}

type Props = {
  lead: Lead
  onStatusChange: (id: string, status: Lead['status']) => void
}

const STATUS_OPTIONS: { value: Lead['status']; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'descartado', label: 'Descartado' },
]

export function KanbanCard({ lead, onStatusChange }: Props) {
  const [open, setOpen] = useState(false)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <>
      <div
        className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate text-sm">
              {lead.nome ?? 'Sem nome'}
            </p>
            {lead.telefone && (
              <p className="text-xs text-gray-500 mt-0.5">{lead.telefone}</p>
            )}
            {lead.email && (
              <p className="text-xs text-gray-400 truncate">{lead.email}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{formatDate(lead.criado_em)}</p>
      </div>

      {/* Modal de detalhes */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Detalhes do Lead</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Nome</label>
                <p className="text-sm text-gray-900 mt-0.5">{lead.nome ?? '—'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Telefone</label>
                <p className="text-sm text-gray-900 mt-0.5">{lead.telefone ?? '—'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                <p className="text-sm text-gray-900 mt-0.5">{lead.email ?? '—'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Chegou em</label>
                <p className="text-sm text-gray-900 mt-0.5">{formatDate(lead.criado_em)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
                <select
                  value={lead.status}
                  onChange={(e) => {
                    onStatusChange(lead.id, e.target.value as Lead['status'])
                    setOpen(false)
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              {lead.telefone && (
                <a
                  href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  WhatsApp
                </a>
              )}
              <button
                onClick={() => setOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
