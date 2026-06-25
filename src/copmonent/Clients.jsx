import React, { useState, useEffect } from 'react'
import { getAuthHeader, getToken, clearToken } from '../utils/auth'
import { useLocalStorageState } from '../utils/useLocalStorage'

const Clients = ({ onNavigate }) => {
  const [savedClients, setSavedClients] = useLocalStorageState('clientsPageData', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [filteredClients, setFilteredClients] = useState(null)
  const [editingClientId, setEditingClientId] = useState(null)
  const [editData, setEditData] = useState({})
  const [showCallForm, setShowCallForm] = useState(false)
  const [selectedCallClient, setSelectedCallClient] = useState(null)
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false)
  const [clientDetailsError, setClientDetailsError] = useState('')
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState('')
  const LOCAL_STORAGE_KEY = 'clientsPageData'

  const [callFormData, setCallFormData] = useState({
    clientId: '',
    existingProduct: '',
    leadStatus: '',
    remarks: '',
    followUpDate: ''
  })

  const [existingProducts, setExistingProducts] = useState([])
  const [existingProductsLoading, setExistingProductsLoading] = useState(false)
  const [existingProductsError, setExistingProductsError] = useState('')
  const [selectedProductDetails, setSelectedProductDetails] = useState(null)
  const [selectedProductLoading, setSelectedProductLoading] = useState(false)
  const [selectedProductError, setSelectedProductError] = useState('')

  const [callSubmitError, setCallSubmitError] = useState('')
  const [callSubmitLoading, setCallSubmitLoading] = useState(false)
  const [callSubmitSuccess, setCallSubmitSuccess] = useState('')

  useEffect(() => {
    const loadClients = async () => {
      setClientsLoading(true)
      setClientsError('')

      try {
        const response = await fetch('https://asg-crm-production.up.railway.app/clients', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          },
          credentials: 'include'
        })

        if (!response.ok) throw new Error(`Unable to load clients (${response.status})`)

        const list = await response.json().catch(() => [])
        const mapped = Array.isArray(list) ? list.map((it) => ({
          ...it,
          pharmacyName: it.pharmacy_name || it.pharmacyName,
          contactPerson: it.contact_person || it.contactPerson,
          mobileNo: it.mobile_no || it.mobileNo,
          leadSource: it.lead_source || it.leadSource,
          address: it.address || it.addr || '',
          cityId: it.city_id ?? it.cityId,
          areaId: it.area_id ?? it.areaId,
          createdBy: it.created_by ?? it.createdBy
        })) : []

        setSavedClients(mapped)
        try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list)) } catch (e) {}
      } catch (err) {
        console.warn('Unable to fetch clients from server, falling back to localStorage', err)
        setClientsError(err.message || 'Unable to load clients')
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (stored) {
          try {
            setSavedClients(JSON.parse(stored) || [])
          } catch (error) {
            console.error('Unable to parse stored clients', error)
          }
        }
      } finally {
        setClientsLoading(false)
      }
    }

    loadClients()
  }, [])

  useEffect(() => {
    const onClientsUpdated = (e) => {
      try {
        const list = e?.detail
        if (Array.isArray(list)) {
          const mapped = list.map((it) => ({
            ...it,
            pharmacyName: it.pharmacy_name || it.pharmacyName,
            contactPerson: it.contact_person || it.contactPerson,
            mobileNo: it.mobile_no || it.mobileNo,
            leadSource: it.lead_source || it.leadSource,
            address: it.address || it.addr || '',
            cityId: it.city_id ?? it.cityId,
            areaId: it.area_id ?? it.areaId,
            createdBy: it.created_by ?? it.createdBy
          }))
          setSavedClients(mapped)
          try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped)) } catch (err) {}
          return
        }
      } catch (err) {}

      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        try {
          setSavedClients(JSON.parse(stored) || [])
        } catch (error) {
          console.error('Unable to parse stored clients on clients:updated', error)
        }
      }
    }

    window.addEventListener('clients:updated', onClientsUpdated)
    return () => window.removeEventListener('clients:updated', onClientsUpdated)
  }, [])

  useEffect(() => {
    const fetchExistingProducts = async () => {
      setExistingProductsLoading(true)
      setExistingProductsError('')

      const token = getToken()
      if (!token) {
        setExistingProductsError('Authentication required to load existing products.')
        setExistingProductsLoading(false)
        return
      }

      try {
        const response = await fetch('https://asg-crm-production.up.railway.app/existing-products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          }
        })
        if (!response.ok) {
          const result = await response.json().catch(() => null)
          const message = result?.detail || result?.message || 'Unable to load existing products'
          throw new Error(message)
        }

        const data = await response.json()
        setExistingProducts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Existing products fetch failed', error)
        setExistingProductsError(error.message || 'Unable to load existing products')
      } finally {
        setExistingProductsLoading(false)
      }
    }

    fetchExistingProducts()
  }, [])

  useEffect(() => {
    const productId = callFormData.existingProduct
    if (!productId) {
      setSelectedProductDetails(null)
      setSelectedProductError('')
      return
    }

    const fetchProductDetails = async () => {
      setSelectedProductLoading(true)
      setSelectedProductError('')

      const token = getToken()
      if (!token) {
        setSelectedProductError('Authentication required to load product details.')
        setSelectedProductLoading(false)
        return
      }

      try {
        const response = await fetch(`https://asg-crm-production.up.railway.app/existing-products/${encodeURIComponent(productId)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
          }
        })

        if (!response.ok) {
          const result = await response.json().catch(() => null)
          const message = result?.detail || result?.message || `Unable to load product details (${response.status})`
          throw new Error(message)
        }

        const data = await response.json().catch(() => null)
        setSelectedProductDetails(data)
      } catch (error) {
        console.error('Existing product detail fetch failed', error)
        setSelectedProductDetails(null)
        setSelectedProductError(error.message || 'Unable to load product details')
      } finally {
        setSelectedProductLoading(false)
      }
    }

    fetchProductDetails()
  }, [callFormData.existingProduct])

  const createClientOnServer = async (client) => {
    try {
      const payload = {
        pharmacy_name: client.pharmacyName || client.pharmacy_name || client.name || client.client || '',
        contact_person: client.contactPerson || client.contact_person || '',
        mobile_no: client.mobileNo || client.mobile_no || '',
        email: client.email || '',
        lead_source: client.leadSource || client.lead_source || '',
        address: client.address || '',
        city_id: client.cityId || client.city_id || null,
        area_id: client.areaId || client.area_id || null
      }

      console.debug('Creating client on server with payload:', payload)
      const authHeaders = getAuthHeader()
      console.debug('Create client auth headers:', authHeaders)
      const response = await fetch('https://asg-crm-production.up.railway.app/clients', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        console.warn('Create client failed', result || response.status)
        setCallSubmitError(`Create client failed: ${JSON.stringify(result)}`)
        return null
      }

      const saved = await response.json().catch(() => null)
      if (saved) {
        try {
          const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]')
          const base = Array.isArray(stored) ? stored : []
          const updated = [saved, ...base]
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
          setSavedClients(updated)
        } catch (e) {
          console.warn('Unable to update local storage after creating client', e)
        }
        return saved
      }
    } catch (error) {
      console.error('createClientOnServer error', error)
    }

    return null
  }

  const handleRemoveClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return
    }

    try {
      console.debug('handleRemoveClient called with clientId:', clientId)
      // guard against template placeholder values like "{client_id}"
      if (typeof clientId === 'string' && clientId.includes('{')) {
        console.error('Invalid clientId detected, aborting delete request', clientId)
        alert('Unable to delete: invalid client identifier. Reload the clients list and try again.')
        return
      }

      const tokenData = getToken()
      console.debug('Delete client - token data:', tokenData ? { ...tokenData, accessToken: tokenData.accessToken ? '***' : null } : 'NO TOKEN')
      
        if (!tokenData || !tokenData.accessToken) {
        alert('Authentication required. Please log in again.')
        return
      }

      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
      console.debug('Delete client - Authorization header:', headers.Authorization ? 'Present' : 'Missing')

      const response = await fetch(`https://asg-crm-production.up.railway.app/clients/${encodeURIComponent(clientId)}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

        if (response.status === 401) {
          console.warn('Delete attempt returned 401. Authentication failed.')
          const authHeader = getAuthHeader()
          // If we attempted with an Authorization header, assume token expired
          if (authHeader && authHeader.Authorization) {
            console.warn('Authorization header was sent; clearing local token and prompting login.')
            try { clearToken() } catch (e) {}
            alert('Session expired or invalid. Please log in again.')
            if (onNavigate) onNavigate('login')
            return
          }
          // Otherwise try cookie retry as before
          console.warn('Retrying using cookies only.')
        // retry without Authorization header to let server use cookie auth if available
        const resp2 = await fetch(`https://asg-crm-production.up.railway.app/clients/${encodeURIComponent(clientId)}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        if (!resp2.ok) {
          const text2 = await resp2.text().catch(() => '')
          let parsed2 = null
          try { parsed2 = JSON.parse(text2) } catch (e) { parsed2 = text2 }
          console.warn('Delete retry (cookies) failed', resp2.status, parsed2)
          alert(`Unable to delete client (cookie retry): ${resp2.status} ${JSON.stringify(parsed2)}`)
          return
        }
        // success on retry
        const updated2 = savedClients.filter((client) => client.id !== clientId)
        setSavedClients(updated2)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated2))
        console.debug('Client deleted successfully (via cookie auth)')
        return
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        let parsed = null
        try { parsed = JSON.parse(text) } catch (e) { parsed = text }
        console.warn('Delete client failed', response.status, parsed)
        alert(`Unable to delete client: ${response.status} ${JSON.stringify(parsed)}`)
        return
      }

      // only remove from local state after server confirms deletion
      const updated = savedClients.filter((client) => client.id !== clientId)
      setSavedClients(updated)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      console.debug('Client deleted successfully')
    } catch (error) {
      console.error('Unable to remove client from server', error)
      alert(`Unable to delete client: ${error.message}`)
    }
  }

  const handleEditClient = async (client) => {
    setEditingClientId(client.id)
    
    // fetch from server to get latest details
    try {
      const token = getToken()
      if (!token) {
        console.warn('No token available, using local data')
        setEditData({
          pharmacyName: client.pharmacyName || client.pharmacy_name || '',
          contactPerson: client.contactPerson || client.contact_person || '',
          mobileNo: client.mobileNo || client.mobile_no || '',
          email: client.email || '',
          leadSource: client.leadSource || client.lead_source || '',
          address: client.address || ''
        })
        return
      }

      const response = await fetch(`https://asg-crm-production.up.railway.app/clients/${encodeURIComponent(client.id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      })

      if (!response.ok) {
        console.warn('Unable to fetch client details from server, using local data')
        setEditData({
          pharmacyName: client.pharmacyName || client.pharmacy_name || '',
          contactPerson: client.contactPerson || client.contact_person || '',
          mobileNo: client.mobileNo || client.mobile_no || '',
          email: client.email || '',
          leadSource: client.leadSource || client.lead_source || '',
          address: client.address || ''
        })
        return
      }

      const serverClient = await response.json().catch(() => null)
      if (serverClient) {
        setEditData({
          pharmacyName: serverClient.pharmacy_name || serverClient.pharmacyName || '',
          contactPerson: serverClient.contact_person || serverClient.contactPerson || '',
          mobileNo: serverClient.mobile_no || serverClient.mobileNo || '',
          email: serverClient.email || '',
          leadSource: serverClient.lead_source || serverClient.leadSource || '',
          address: serverClient.address || ''
        })
      } else {
        setEditData({
          pharmacyName: client.pharmacyName || client.pharmacy_name || '',
          contactPerson: client.contactPerson || client.contact_person || '',
          mobileNo: client.mobileNo || client.mobile_no || '',
          email: client.email || '',
          leadSource: client.leadSource || client.lead_source || '',
          address: client.address || ''
        })
      }
    } catch (err) {
      console.error('Error fetching client details:', err)
      setEditData({
        pharmacyName: client.pharmacyName || client.pharmacy_name || '',
        contactPerson: client.contactPerson || client.contact_person || '',
        mobileNo: client.mobileNo || client.mobile_no || '',
        email: client.email || '',
        leadSource: client.leadSource || client.lead_source || '',
        address: client.address || ''
      })
    }
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCancelEdit = () => {
    setEditingClientId(null)
    setEditData({})
  }

  const handleCallButton = (client) => {
    setSelectedCallClient(client)
    setClientDetailsError('')
    setShowCallForm(true)
    setCallFormData({
      clientId: client.id || '',
      existingProduct: '',
      leadStatus: '',
      remarks: '',
      followUpDate: ''
    })
    try {
      if (client && client.id) localStorage.setItem('selected_client_for_call', String(client.id))
    } catch (e) {
      // ignore
    }
  }

  const handleCallFormChange = (e) => {
    const { name, value } = e.target
    setCallFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const fetchClientById = async (clientId) => {
    if (!clientId) return null
    setClientDetailsLoading(true)
    setClientDetailsError('')

    try {
      const response = await fetch(`https://asg-crm-production.up.railway.app/clients/${encodeURIComponent(clientId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        const message = result?.detail || result?.message || `Unable to load client ${clientId}`
        throw new Error(message)
      }

      const data = await response.json().catch(() => null)
      return data
    } catch (error) {
      console.error('Unable to load client by id', error)
      setClientDetailsError(error.message || 'Unable to load client details.')
      return null
    } finally {
      setClientDetailsLoading(false)
    }
  }

  const handleCallFormSubmit = async (e) => {
    e.preventDefault()
    if (!callFormData.clientId) {
      setCallSubmitError('Client ID is required.')
      return
    }
    setCallSubmitError('')
    setCallSubmitLoading(true)

    const token = getToken()
    if (!token) {
      setCallSubmitError('Not authenticated. Please log in.')
      setCallSubmitLoading(false)
      return
    }

    const clientId = callFormData.clientId
    const newCall = {
      client_id: Number(clientId),
      client_name: selectedCallClient?.pharmacyName || selectedCallClient?.name || selectedCallClient?.pharmacy_name || '',
      ...(callFormData.existingProduct ? { existing_product_id: Number(callFormData.existingProduct) } : {}),
      lead_status: callFormData.leadStatus.trim(),
      remarks: callFormData.remarks.trim(),
      follow_up_date: callFormData.followUpDate
    }

    try {
      const callLogsUrl = 'https://asg-crm-production.up.railway.app/call-logs'
      console.debug('Auth headers before saving call log:', getAuthHeader())
      console.debug('Submitting call-log payload to POST', callLogsUrl, newCall)
      const response = await fetch(callLogsUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(newCall)
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        const message = result?.detail || result?.message || `Unable to save call log. Status ${response.status}`
        setCallSubmitError(message)
        throw new Error(message)
      }

      const callLogIdFromServer = result?.id || result?.call_log_id || result?.callLogId || Date.now().toString()
      const finalRecord = {
        ...newCall,
        pharmacyName: selectedCallClient?.pharmacyName || selectedCallClient?.name || selectedCallClient?.pharmacy_name || '',
        id: callLogIdFromServer
      }

      const storedCalls = JSON.parse(localStorage.getItem('callsPageData') || '[]')
      const updatedCalls = [finalRecord, ...(Array.isArray(storedCalls) ? storedCalls : [])]
      localStorage.setItem('callsPageData', JSON.stringify(updatedCalls))

      setCallSubmitSuccess(`Call log saved successfully for ${selectedCallClient?.pharmacyName || 'the client'}!`)
      setCallSubmitError('')

      // Close form and reset
      setShowCallForm(false)
      setSelectedCallClient(null)
      setCallFormData({
        clientId: '',
        existingProduct: '',
        leadStatus: '',
        remarks: '',
        followUpDate: ''
      })

      // Update call cache immediately
      const cachedCalls = JSON.parse(localStorage.getItem('callsPageData') || '[]')
      const newCache = [finalRecord, ...(Array.isArray(cachedCalls) ? cachedCalls : [])]
      localStorage.setItem('callsPageData', JSON.stringify(newCache))

      try {
        localStorage.removeItem('selected_client_for_call')
      } catch (e) {}

      // Navigate to Calls page after 1.5 seconds to show success message
      setTimeout(() => {
        setCallSubmitSuccess('')
        if (onNavigate) {
          onNavigate('calls')
        }
      }, 1500)
    } catch (error) {
      console.error('Unable to save call log', error)
      setCallSubmitError(error.message || 'Unable to save call log')
    } finally {
      setCallSubmitLoading(false)
    }
  }

  const normalizePharmacyName = (client) => {
    return (
      client.pharmacyName ||
      client.pharmacy_name ||
      client.name ||
      ''
    ).toString().toLowerCase()
  }



  const getExistingProductLabel = (product) => {
    return (
      product.product_name ||
      product.name ||
      product.title ||
      product.id ||
      ''
    ).toString()
  }

  const filterClients = (value) => {
    const query = value.trim().toLowerCase()
    if (!query) {
      setFilteredClients(null)
      setSearchError('')
      return
    }

    const filtered = savedClients.filter((client) =>
      normalizePharmacyName(client).includes(query)
    )

    setFilteredClients(filtered)
    setSearchError(filtered.length === 0 ? 'No clients match your search.' : '')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchLoading(true)
    setSearchError('')

    filterClients(searchTerm)
    setSearchLoading(false)
  }

  const handleSearchTermChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    filterClients(value)
  }

  useEffect(() => {
    if (searchTerm.trim()) {
      filterClients(searchTerm)
    }
  }, [savedClients])

  const handleSaveClient = async (clientId) => {
    const updatedClients = savedClients.map((client) => {
      if (client.id !== clientId) return client
      return {
        ...client,
        pharmacyName: editData.pharmacyName,
        contactPerson: editData.contactPerson,
        mobileNo: editData.mobileNo,
        email: editData.email,
        leadSource: editData.leadSource,
        address: editData.address
      }
    })

    setSavedClients(updatedClients)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedClients))
    setEditingClientId(null)
    setEditData({})

    try {
      const updatedClient = updatedClients.find((client) => client.id === clientId)
      const response = await fetch(`https://asg-crm-production.up.railway.app/clients/${encodeURIComponent(clientId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedClient)
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        const message = result?.detail || result?.message || 'Unable to update client on server'
        throw new Error(message)
      }
    } catch (error) {
      console.error('Unable to update client on server', error)
    }
  }

  const displayedClients = filteredClients !== null ? filteredClients : savedClients

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Saved Clients</h1>
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="Search by client name"
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <button
              type="submit"
              className="rounded-2xl bg-indigo-600 text-white px-6 py-3 text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Search
            </button>
          </form>
          {searchLoading && <p className="text-sm text-slate-500 mt-2">Searching clients...</p>}
          {searchError && <p className="text-sm text-red-500 mt-2">{searchError}</p>}
        </div>
        {showCallForm && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Call Log for {selectedCallClient?.pharmacyName || 'Client'}</h2>
            <form onSubmit={handleCallFormSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
                  <input
                    type="text"
                    value={selectedCallClient?.pharmacyName || ''}
                    readOnly
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 bg-slate-100"
                    placeholder="Client"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Client ID</label>
                  <input
                    type="text"
                    name="clientId"
                    value={callFormData.clientId}
                    onChange={handleCallFormChange}
                    readOnly
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 bg-slate-100"
                    placeholder="Client ID"
                  />
                </div>
              </div>
              <div className="relative">
                <select
                  name="existingProduct"
                  value={callFormData.existingProduct}
                  onChange={handleCallFormChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 bg-white"
                >
                    <option value="">Select existing product</option>
                    {existingProducts.map((product) => {
                      const label = getExistingProductLabel(product)
                      return (
                        <option key={product.id || label} value={product.id || label}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </div>
              {existingProductsError ? (
                <p className="text-sm text-red-500">{existingProductsError}</p>
              ) : existingProductsLoading ? (
                <p className="text-sm text-slate-500">Loading existing products...</p>
              ) : null}
              {clientDetailsError ? (
                <p className="text-sm text-red-500">{clientDetailsError}</p>
              ) : clientDetailsLoading ? (
                <p className="text-sm text-slate-500">Loading client details...</p>
              ) : null}
              {selectedProductError ? (
                <p className="text-sm text-red-500">{selectedProductError}</p>
              ) : selectedProductLoading ? (
                <p className="text-sm text-slate-500">Loading selected product details...</p>
              ) : selectedProductDetails ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 mt-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Selected Product Details</h3>
                  <p className="text-sm text-slate-600">Name: {selectedProductDetails.product_name || selectedProductDetails.name || 'N/A'}</p>
                  <p className="text-sm text-slate-600">ID: {selectedProductDetails.id || 'N/A'}</p>
                  {selectedProductDetails.description && (
                    <p className="text-sm text-slate-600">Description: {selectedProductDetails.description}</p>
                  )}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setCallFormData(prev => ({ ...prev, existingProduct: selectedProductDetails.id }))}
                      className="rounded-2xl bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition"
                    >
                      Use this product
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  name="leadStatus"
                  value={callFormData.leadStatus}
                  onChange={handleCallFormChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  placeholder="Lead Status"
                />
                <textarea
                  name="remarks"
                  value={callFormData.remarks}
                  onChange={handleCallFormChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 min-h-30 resize-none"
                  placeholder="Remarks"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="date"
                  name="followUpDate"
                  value={callFormData.followUpDate}
                  onChange={handleCallFormChange}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
                <div className="w-full" />
              </div>
              {callSubmitError && <p className="text-sm text-red-500">{callSubmitError}</p>}
              {callSubmitSuccess && <p className="text-sm text-green-600 font-semibold">{callSubmitSuccess}</p>}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-indigo-600 text-white px-6 py-3 text-sm font-semibold hover:bg-indigo-700 transition"
                  disabled={callSubmitLoading}
                >
                  {callSubmitLoading ? 'Saving...' : 'Save Call'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCallForm(false)}
                  className="rounded-2xl bg-slate-300 text-slate-900 px-6 py-3 text-sm font-semibold hover:bg-slate-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          {displayedClients.length === 0 ? (
            <p className="text-slate-600">{searchTerm.trim() ? 'No clients match your search.' : 'No clients have been saved yet.'}</p>
          ) : (
            <div className="grid gap-4">
              {displayedClients.map((client) => (
                <div key={client.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  {editingClientId === client.id ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          name="pharmacyName"
                          value={editData.pharmacyName}
                          onChange={handleEditInputChange}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="Pharmacy Name"
                        />
                        <input
                          type="text"
                          name="contactPerson"
                          value={editData.contactPerson}
                          onChange={handleEditInputChange}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="Contact Person"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input
                          type="tel"
                          name="mobileNo"
                          value={editData.mobileNo}
                          onChange={handleEditInputChange}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="Mobile No"
                        />
                        <input
                          type="email"
                          name="email"
                          value={editData.email}
                          onChange={handleEditInputChange}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="Email"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input
                          type="text"
                          name="leadSource"
                          value={editData.leadSource}
                          onChange={handleEditInputChange}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="Lead Source"
                        />
                        <input
                          type="text"
                          name="address"
                          value={editData.address}
                          onChange={handleEditInputChange}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                          placeholder="Address"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveClient(client.id)}
                          className="rounded-2xl bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 transition"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded-2xl bg-slate-300 text-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-400 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{client.pharmacy_name || client.pharmacyName || 'Unnamed pharmacy'}</p>
                      </div>
                      <div className="flex flex-col gap-3 w-24">
                        <button
                          type="button"
                          onClick={() => handleEditClient(client)}
                          className="w-full rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCallButton(client)}
                          className="w-full rounded-2xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition"
                        >
                          Calls
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveClient(client.id)}
                          className="w-full rounded-2xl bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Clients
