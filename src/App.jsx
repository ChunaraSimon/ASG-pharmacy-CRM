import React from 'react'
import Signup from './copmonent/Signup'
import Login from './copmonent/Login'
import Layout from './copmonent/Layout'
import Home from './copmonent/Home'
import Marketing from './copmonent/Marketing'
import Client from './copmonent/Client'
import Clients from './copmonent/Clients'
import Calls from './copmonent/Calls'
import Users from './copmonent/Users'
import ExistingProducts from './copmonent/ExistingProducts'
import Deals from './copmonent/Deals'
import DealsList from './copmonent/DealsList'
import { useLocalStorageState } from './utils/useLocalStorage'

const App = () => {
  const [role, setRole] = useLocalStorageState('app-user-role', null)
  const [page, setPage] = useLocalStorageState('app-current-page', 'signup')

  const handleLoginSuccess = (nextPage, userRole) => {
    setRole(userRole)
    setPage(nextPage)
  }

  const handleLogout = () => {
    setRole(null)
    setPage('login')
  }

  return (
    <div>
      {page === 'signup' ? (
        <Signup onSwitch={setPage} />
      ) : page === 'login' ? (
        <Login onLogin={handleLoginSuccess} onSwitch={setPage} />
      ) : role ? (
        <Layout onNavigate={setPage} onLogout={handleLogout} currentPage={page} role={role}>
          {page === 'home' ? (
            <Home />
          ) : page === 'marketing' ? (
            <Marketing />
          ) : page === 'deals' ? (
            <Deals />
          ) : page === 'manage-deals' ? (
            <DealsList />
          ) : page === 'client' ? (
            <Client />
          ) : page === 'clients' ? (
            <Clients onNavigate={setPage} />
          ) : page === 'calls' ? (
            <Calls />
          ) : page === 'users' ? (
            <Users />
          ) : page === 'existing-products' ? (
            <ExistingProducts />
          ) : null}
        </Layout>
      ) : (
        <Login onLogin={handleLoginSuccess} onSwitch={setPage} />
      )}
    </div>
  )
}

export default App
