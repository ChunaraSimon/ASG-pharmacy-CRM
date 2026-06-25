import React, { useState } from 'react'
import { saveToken, saveRole } from '../utils/auth'

const Login = ({ onLogin, onSwitch }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log('Current form data:', formData)

    if (!formData.email || formData.email.trim() === '') {
      alert('Email is required')
      return
    }
    
    if (!formData.password || formData.password.trim() === '') {
      alert('Password is required')
      return
    }

    try {
      const params = new URLSearchParams()
      params.append('grant_type', 'password')
      params.append('username', formData.email.trim())
      params.append('password', formData.password.trim())

      console.log('Final payload to send:', params.toString())

      const response = await fetch('https://asg-crm-production.up.railway.app/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.log('Error response:', errorData)
        const message = errorData?.detail?.[0]?.msg || errorData?.message || 'Login request failed.'
        throw new Error(message)
      }

      const result = await response.json().catch(() => null)
      console.log('Success response:', result)

      const authToken = result?.access_token || result?.token
      if (!authToken) {
        throw new Error('Login succeeded but no access token was returned.')
      }

      saveToken(authToken, result?.token_type || 'Bearer')
      console.log('Saved token type:', result?.token_type || 'Bearer', 'token source:', result?.access_token ? 'access_token' : 'token')

      const selectedRole = formData.role || result?.role || 'admin'
      saveRole(selectedRole)
      const loweredRole = selectedRole.toLowerCase()
      const nextPage = loweredRole === 'sales' ? 'sales' : ['marketing'].includes(loweredRole) ? 'marketing' : 'home'
      alert(result?.message || 'Login successful!')
      onLogin(nextPage, selectedRole)
    } catch (error) {
      console.error('Login error:', error)
      alert(error.message || 'An error occurred while logging in.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-700 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-6">Login</h1>
        <p className="text-sm text-slate-600 text-center mb-8">Enter your credentials to access your account.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="admin">Admin</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Sales</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 font-semibold shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-transform"
          >
            Sign In
          </button>
        </form>

        <p className="text-sm text-center text-slate-500 mt-6">
          Don't have an account?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onSwitch('signup')
            }}
            className="font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

export default Login
