export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Erro de autenticação</h1>
        <p className="text-sm text-gray-500 mb-6">
          O link de acesso expirou ou é inválido. Por favor, tente fazer login novamente.
        </p>
        <a
          href="/login"
          className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          Voltar para o login
        </a>
      </div>
    </div>
  )
}
