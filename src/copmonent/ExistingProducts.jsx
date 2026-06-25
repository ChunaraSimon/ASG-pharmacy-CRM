import React, { useState, useEffect } from 'react'
import { getAuthHeader, getToken, getRole } from '../utils/auth'
import { useLocalStorageState } from '../utils/useLocalStorage'

const ExistingProducts = () => {
  const [productName, setProductName] = useState('')
  const [products, setProducts] = useLocalStorageState('existingProductsData', [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [role, setRole] = useState(getRole())
  const isAdmin = role?.toLowerCase() === 'admin'

  const ensureAuth = () => {
    const tokenData = getToken()
    if (!tokenData) {
      throw new Error('Authentication required. Please log in again.')
    }
    console.log('ExistingProducts token data:', tokenData)
    return tokenData
  }

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      ensureAuth()
      const authHeaders = getAuthHeader()
      if (!authHeaders.Authorization) {
        throw new Error('Missing authentication header. Please log in again.')
      }

      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders
      }

      const response = await fetch('https://asg-crm-production.up.railway.app/existing-products', {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        const message = result?.detail || result?.message || 'Failed to load products.'
        throw new Error(message)
      }

      const result = await response.json()
      const list = Array.isArray(result) ? result : []
      setProducts(list)
      return list
    } catch (fetchError) {
      console.error('Fetch products error:', fetchError)
      setError(fetchError.message || 'Unable to load products.')
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      ensureAuth()
      const authHeaders = getAuthHeader()
      if (!authHeaders.Authorization) {
        throw new Error('Missing authentication header. Please log in again.')
      }
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders
      }

      const response = await fetch(`https://asg-crm-production.up.railway.app/existing-products/${productId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      console.log('Delete response status:', response.status)

      const responseText = await response.text()
      console.log('Delete response body:', responseText)

      if (response.status === 200 || response.status === 204) {
        alert('Product deleted successfully')
        fetchProducts()
        return
      }

      // Handle error responses
      let message = 'Failed to delete product.'
      if (responseText) {
        try {
          const result = JSON.parse(responseText)
          message = result?.detail || result?.message || message
        } catch (e) {
          message = responseText
        }
      }
      throw new Error(`${message} (Status: ${response.status})`)
    } catch (error) {
      console.error('Delete product error:', error)
      alert(error.message || 'An error occurred while deleting the product.')
    }
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setEditValue(product.product_name)
  }

  const handleSaveEdit = async (productId) => {
    if (!editValue.trim()) {
      alert('Product name cannot be empty')
      return
    }

    try {
      ensureAuth()
      const authHeaders = getAuthHeader()
      if (!authHeaders.Authorization) {
        throw new Error('Missing authentication header. Please log in again.')
      }
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders
      }

      console.log('Updating product ID:', productId, 'New name:', editValue)
      console.log('ExistingProducts auth headers:', headers)

      const response = await fetch(`https://asg-crm-production.up.railway.app/existing-products/${productId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          product_name: editValue.trim()
        })
      })

      console.log('Update response status:', response.status)

      const responseText = await response.text()
      console.log('Update response body:', responseText)

      if (response.status === 200) {
        alert('Product updated successfully')
        setEditingId(null)
        setEditValue('')
        fetchProducts()
        return
      }

      // Handle error responses
      let message = 'Failed to update product.'
      if (responseText) {
        try {
          const result = JSON.parse(responseText)
          message = result?.detail || result?.message || message
        } catch (e) {
          message = responseText
        }
      }
      throw new Error(`${message} (Status: ${response.status})`)
    } catch (error) {
      console.error('Update product error:', error)
      alert(error.message || 'An error occurred while updating the product.')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!productName.trim()) {
      alert('Please enter a product name')
      return
    }

    const payload = {
      id: 0,
      product_name: productName.trim()
    }

    try {
      ensureAuth()
      const authHeaders = getAuthHeader()
      if (!authHeaders.Authorization) {
        throw new Error('Missing authentication header. Please log in again.')
      }
      if (!isAdmin) {
        throw new Error('Forbidden. Only admin users can add new existing products.')
      }
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders
      }

      // Debug logs to help diagnose 403 issues
      try {
        console.log('ExistingProducts: getToken():', getToken())
      } catch (e) {
        console.warn('Unable to read token via getToken()', e)
      }
      try {
        console.log('ExistingProducts: localStorage access_token, token_type:', localStorage.getItem('access_token'), localStorage.getItem('token_type'))
      } catch (e) {
        console.warn('Unable to access localStorage tokens', e)
      }
      console.log('Create product headers:', headers)
      console.log('Create payload:', payload)

      const response = await fetch('https://asg-crm-production.up.railway.app/existing-products', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const responseText = await response.text().catch(() => null)
      let result = null
      try {
        result = responseText ? JSON.parse(responseText) : null
      } catch (parseError) {
        console.warn('Create product response is not JSON', parseError, responseText)
      }

      if (!response.ok) {
        let message = 'Failed to create product.'
        if (response.status === 401) {
          message = 'Unauthorized. Please log in again.'
        } else if (response.status === 403) {
          message = 'Forbidden. You do not have permission to add products.'
        } else {
          message = result?.detail || result?.message || message
        }
        throw new Error(message)
      }

      // Attempt to refresh server list and locate created product
      setProductName('')
      const serverList = await fetchProducts()

      let createdProduct = null
      if (serverList && serverList.length > 0) {
        // Try to match by product name (server should return product_name)
        createdProduct = serverList.find(
          (p) => (p.product_name || p.name || '').toLowerCase() === payload.product_name.toLowerCase()
        )
      }

      if (createdProduct && createdProduct.id) {
        alert(`Product created successfully (id: ${createdProduct.id})`)
      } else if (result?.id) {
        // server returned id in response body
        setProducts((prevProducts) => [
          ...prevProducts,
          { id: result.id, product_name: result.product_name || payload.product_name }
        ])
        alert(`Product created successfully (id: ${result.id})`)
      } else {
        // Fallback: create a local id so UI shows an id immediately
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
        setProducts((prevProducts) => [
          ...prevProducts,
          { id: localId, product_name: payload.product_name }
        ])
        alert('Product created locally (server did not return an id).')
      }
    } catch (error) {
      console.error('Create product error:', error)
      alert(error.message || 'An error occurred while creating the product.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Existing Products</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mb-8 max-w-lg">
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-slate-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              disabled={!isAdmin}
            />
          </div>

          <button
            type="submit"
            disabled={!isAdmin}
            className={`w-full rounded-2xl py-3 font-semibold shadow-lg shadow-indigo-500/20 transition ${isAdmin ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-300 text-slate-600 cursor-not-allowed'}`}
          >
            Save Product
          </button>
          {!isAdmin && (
            <p className="text-sm text-yellow-700 bg-yellow-50 rounded-2xl border border-yellow-200 p-3">
              Your account does not have permission to add new products. Please log in as an admin to save products.
            </p>
          )}
        </form>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Stored Products</h2>
            {loading && <span className="text-sm text-slate-500">Loading...</span>}
          </div>
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-slate-600">No products found yet.</p>
          ) : (
            <ul className="space-y-3">
              {products.map((product) => (
                <li key={product.id || product.product_name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {editingId === product.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        placeholder="Enter product name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(product.id)}
                        className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-medium hover:bg-green-700 transition"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-lg bg-slate-400 text-white px-3 py-2 text-sm font-medium hover:bg-slate-500 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">{product.product_name}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-lg bg-blue-600 text-white px-3 py-1 text-sm font-medium hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg bg-red-600 text-white px-3 py-1 text-sm font-medium hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
    </div>
  )
}

export default ExistingProducts
