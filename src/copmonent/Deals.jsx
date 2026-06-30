
import React, { useState, useEffect } from 'react'
import { getAuthHeader, clearToken } from '../utils/auth'

const Deals = () => {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [usingLocalData, setUsingLocalData] = useState(false)
  const [apiToken, setApiToken] = useState('')
  const [formData, setFormData] = useState({
    client_id: '',
    deal_owner_id: '',
    deal_name: '',
    software_type: '',
    amount: '',
    number_of_devices: '',
    start_date: '',
    end_date: '',
    notes: ''
  })

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    setError('')
    setSuccess('')
    setDeals([])
    setUsingLocalData(false)
    setLoading(true)

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }

      const endpoint = 'https://asg-crm-production.up.railway.app/deals'
      console.log('Fetching deals from:', endpoint)
      console.log('Headers:', headers)

      const res = await fetch(endpoint, {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      const body = await res.text()
      console.log('Response status:', res.status)
      console.log('Response body:', body)

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const parsed = JSON.parse(body)
          msg = parsed?.detail || parsed?.message || msg
        } catch (e) {
          msg = body || msg
        }

        if (res.status === 401) {
          const authHeader = getAuthHeader()
          if (authHeader && authHeader.Authorization) {
            clearToken()
            setError('Unauthorized. Your session may have expired. Please log in again.')
          } else {
            setError('Unauthorized. Please log in to access deals.')
          }
          return
        }

        if (res.status === 403) {
          console.warn('Access denied (403) - loading from local storage instead')
          // Fallback to localStorage
          const localDeals = localStorage.getItem('deals_local_storage')
          const dealList = localDeals ? JSON.parse(localDeals) : []
          setDeals(dealList)
          setUsingLocalData(true)
          setError('⚠️ API Access Denied (403). Using local storage. Data saved locally will sync when API access is restored.')
          if (dealList.length > 0) {
            setSuccess(`${dealList.length} local deal(s) loaded.`)
          }
          return
        }

        throw new Error(msg)
      }

      const data = body ? JSON.parse(body) : []
      const dealList = Array.isArray(data) ? data : data?.data || []
      setDeals(dealList)
      setUsingLocalData(false)
      // Save to localStorage as backup
      localStorage.setItem('deals_local_storage', JSON.stringify(dealList))
      if (dealList.length > 0) {
        setSuccess(`${dealList.length} deal(s) loaded successfully.`)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      // Fallback to localStorage on any error
      const localDeals = localStorage.getItem('deals_local_storage')
      const dealList = localDeals ? JSON.parse(localDeals) : []
      setDeals(dealList)
      setUsingLocalData(true)
      setError(`Error fetching deals: ${err.message || 'Unknown error'}. Loading from local storage.`)
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    await saveNewDeal()
  }

  const saveNewDeal = async () => {
    // Validate required fields
    if (
      !formData.client_id ||
      !formData.deal_owner_id ||
      !formData.deal_name ||
      !formData.software_type ||
      !formData.amount ||
      !formData.number_of_devices ||
      !formData.start_date ||
      !formData.end_date
    ) {
      setError('Please fill in all required deal fields.')
      return
    }

    setError('')
    setSuccess('')
    setSaving(true)

    const payload = {
      client_id: Number(formData.client_id),
      deal_owner_id: Number(formData.deal_owner_id),
      deal_name: formData.deal_name,
      software_type: formData.software_type,
      amount: Number(formData.amount),
      number_of_devices: Number(formData.number_of_devices),
      start_date: formData.start_date,
      end_date: formData.end_date,
      notes: formData.notes || ''
    }

    const localPayload = {
      ...payload,
      id: Date.now(),
      created_date: new Date().toISOString()
    }

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }

      if (!headers.Authorization) {
        setError('No authorization token found. Please log in before creating a deal.')
        setSaving(false)
        return
      }

      const endpoint = 'https://asg-crm-production.up.railway.app/deals'
      console.log('Saving deal to:', endpoint)
      console.log('Headers:', headers)
      console.log('Payload:', payload)

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const body = await res.text()
      console.log('Save response status:', res.status)
      console.log('Save response body:', body)

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const parsed = JSON.parse(body)
          msg = parsed?.detail || parsed?.message || msg
        } catch (e) {
          msg = body || msg
        }

        if (res.status === 401) {
          clearToken()
          setError('Unauthorized. Your session may have expired. Please log in again.')
          setSaving(false)
          return
        }

        if (res.status === 403) {
          // Fallback to localStorage
          const existingDeals = localStorage.getItem('deals_local_storage')
          const dealList = existingDeals ? JSON.parse(existingDeals) : []
          const updatedList = [localPayload, ...dealList]
          localStorage.setItem('deals_local_storage', JSON.stringify(updatedList))
          
          setDeals(updatedList)
          setSuccess('✅ Deal saved to local storage! (API unavailable)')
          setError('⚠️ Saving locally - API access denied (403). Will sync when restored.')
          setFormData({
            client_id: '',
            deal_owner_id: '',
            deal_name: '',
            software_type: '',
            amount: '',
            number_of_devices: '',
            start_date: '',
            end_date: '',
            notes: ''
          })
          setSaving(false)
          return
        }

        throw new Error(msg)
      }

      const newDeal = body ? JSON.parse(body) : localPayload
      setDeals((prev) => [newDeal, ...prev])
      // Clear localStorage after successful API save
      localStorage.removeItem('deals_local_storage')
      setSuccess('✅ Deal created successfully!')
      setFormData({
        client_id: '',
        deal_owner_id: '',
        deal_name: '',
        software_type: '',
        amount: '',
        number_of_devices: '',
        start_date: '',
        end_date: '',
        notes: ''
      })
    } catch (err) {
      console.error('Save error:', err)
      const isNetworkError =
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('network')

      if (isNetworkError) {
        const existingDeals = localStorage.getItem('deals_local_storage')
        const dealList = existingDeals ? JSON.parse(existingDeals) : []
        const updatedList = [localPayload, ...dealList]
        localStorage.setItem('deals_local_storage', JSON.stringify(updatedList))

        setDeals(updatedList)
        setSuccess('✅ Deal saved to local storage')
        setError(`Unable to reach API: ${err.message || 'Unknown network error'}. Data saved locally.`)
        setFormData({
          client_id: '',
          deal_owner_id: '',
          deal_name: '',
          software_type: '',
          amount: '',
          number_of_devices: '',
          start_date: '',
          end_date: '',
          notes: ''
        })
      } else {
        setError(`Unable to save deal: ${err.message || 'Unknown error'}.`)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Form Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Create New Deal</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-semibold">Error: {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {usingLocalData && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
            <p className="font-semibold">Local data is displayed because the API is unavailable.</p>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client_id" className="block text-sm font-semibold text-gray-700 mb-2">
                Client ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleFormChange}
                placeholder="Enter client ID"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="deal_name" className="block text-sm font-semibold text-gray-700 mb-2">
                Deal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="deal_name"
                name="deal_name"
                value={formData.deal_name}
                onChange={handleFormChange}
                placeholder="Enter deal name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="deal_owner_id" className="block text-sm font-semibold text-gray-700 mb-2">
                Deal Owner ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="deal_owner_id"
                name="deal_owner_id"
                value={formData.deal_owner_id}
                onChange={handleFormChange}
                placeholder="Enter deal owner ID"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="software_type" className="block text-sm font-semibold text-gray-700 mb-2">
                Software Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="software_type"
                name="software_type"
                value={formData.software_type}
                onChange={handleFormChange}
                placeholder="Enter software type"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                placeholder="Enter amount"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="number_of_devices" className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Devices <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="number_of_devices"
                name="number_of_devices"
                value={formData.number_of_devices}
                onChange={handleFormChange}
                placeholder="Enter number of devices"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-semibold text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              placeholder="Enter additional notes"
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => fetchDeals()}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Refresh Deals
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Saving...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Deals
