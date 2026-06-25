import React, { useState, useEffect } from 'react'
import { getAuthHeader, getToken } from '../utils/auth'
import { useLocalStorageState } from '../utils/useLocalStorage'

const Users = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const [users, setUsers] = useLocalStorageState('usersPageData', [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const tokenData = getToken()
      if (!tokenData) {
        throw new Error('Authentication required. Please log in again.')
      }
      console.log('Fetch users token data:', tokenData)

      const headers = getAuthHeader()
      console.log('Fetch users headers:', headers)

      const response = await fetch('https://asg-crm-production.up.railway.app/users', {
        method: 'GET',
        headers
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.detail || result?.message || 'Failed to load users.')
      }
      setUsers(result || [])
    } catch (err) {
      console.error('Fetch users error:', err)
      setError(err.message || 'Error loading users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.role.trim()) {
      alert('Please fill in all fields')
      return
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role.trim()
    }

    try {
      const tokenData = getToken()
      if (!tokenData) {
        throw new Error('Authentication required. Please log in again.')
      }
      console.log('Create user token data:', tokenData)

      const headers = {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      }
      console.log('Create user headers:', headers)

      const response = await fetch('https://asg-crm-production.up.railway.app/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      const result = await response.json().catch(() => null)
      if (!response.ok) {
        const message = result?.detail || result?.message || 'Failed to create user.'
        throw new Error(message)
      }

      console.log('Create user response:', result)
      alert('User created successfully')
      setFormData({ name: '', email: '', password: '', role: '' })
      fetchUsers()
    } catch (error) {
      console.error('Create user error:', error)
      alert(error.message || 'An error occurred while creating the user.')
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Users</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mb-10">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter name"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">Role</label>
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="Enter role"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-indigo-600 text-white py-3 px-6 font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition"
        >
          Save User
        </button>
      </form>

      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Stored Users</h2>
        {loading ? (
          <p className="text-slate-600">Loading users...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : users.length === 0 ? (
          <p className="text-slate-600">No users found.</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id || user.email} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="text-slate-600 text-sm">{user.email}</p>
                <p className="text-slate-600 text-sm">Role: {user.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Users
