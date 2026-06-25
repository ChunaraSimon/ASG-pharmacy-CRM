import React from 'react'

const Layout = ({ children, onNavigate, onLogout, currentPage, role }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-700 flex p-6">
      <aside className="w-72 bg-slate-950/90 text-white rounded-3xl shadow-2xl border border-white/10 p-6 mr-6 flex flex-col justify-between transition-all duration-700 ease-out hover:-translate-y-1 fixed h-[calc(100vh-3rem)]">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-indigo-600 flex items-center justify-center text-2xl shadow-lg">
              <span>👤</span>
            </div>
            <div>
              <p className="text-sm text-slate-300">Welcome back</p>
              <p className="text-xl font-semibold">User</p>
            </div>
          </div>

          <nav className="space-y-3">
            {role?.toLowerCase() === 'sales' ? (
              <>
                <button
                  onClick={() => onNavigate('deals')}
                  className={`w-full text-left rounded-2xl px-4 py-3 font-medium transition ${
                    currentPage === 'deals'
                      ? 'bg-indigo-600/20 text-white'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Create Deal
                </button>
                <button
                  onClick={() => onNavigate('manage-deals')}
                  className={`w-full text-left rounded-2xl px-4 py-3 font-medium transition ${
                    currentPage === 'manage-deals'
                      ? 'bg-indigo-600/20 text-white'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Manage Deals
                </button>
              </>
            ) : role?.toLowerCase() === 'marketing' ? (
              <>
                <button
                  onClick={() => onNavigate('client')}
                  className={`w-full text-left rounded-2xl px-4 py-3 font-medium transition ${
                    currentPage === 'client'
                      ? 'bg-indigo-600/20 text-white'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Client
                </button>
                <button
                  onClick={() => onNavigate('clients')}
                  className={`w-full text-left rounded-2xl px-4 py-3 font-medium transition ${
                    currentPage === 'clients'
                      ? 'bg-indigo-600/20 text-white'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Clients
                </button>
                <button
                  onClick={() => onNavigate('calls')}
                  className={`w-full text-left rounded-2xl px-4 py-3 font-medium transition ${
                    currentPage === 'calls'
                      ? 'bg-indigo-600/20 text-white'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Calls
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('users')}
                  className={`w-full text-left rounded-2xl px-4 py-3 font-medium transition ${
                    currentPage === 'users'
                      ? 'bg-indigo-600/20 text-white'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => onNavigate('existing-products')}
                  className={`w-full text-left rounded-2xl px-4 py-3 font-medium transition ${
                    currentPage === 'existing-products'
                      ? 'bg-indigo-600/20 text-white'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Existing Products
                </button>
              </>
            )}
          </nav>
        </div>

        <button
          onClick={onLogout}
          className="w-full rounded-2xl bg-slate-100 text-slate-950 py-3 font-semibold hover:bg-white transition"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 ml-80 bg-white/90 rounded-3xl shadow-2xl border border-white/30 p-10 backdrop-blur-xl animate-[fadeInUp_0.8s_ease-out]">
        {children}
      </main>
    </div>
  )
}

export default Layout
