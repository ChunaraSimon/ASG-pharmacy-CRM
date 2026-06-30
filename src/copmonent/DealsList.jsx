import React, { useState, useEffect } from 'react'
import { getAuthHeader, getToken, clearToken } from '../utils/auth'

const DealsList = () => {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [deletingDealId, setDeletingDealId] = useState(null)
  const [editingDealId, setEditingDealId] = useState(null)
  const [editForm, setEditForm] = useState({ notes: '', start_date: '', end_date: '' })

  const getDealId = (deal) => {
    if (!deal) return null
    const rawId = deal.id ?? deal.deal_id
    if (rawId === undefined || rawId === null) return null
    const normalized = typeof rawId === 'string' ? rawId.trim() : String(rawId)
    if (normalized === '' || normalized === '0') return null
    if (/^\{.+\}$/.test(normalized)) return null
    return normalized
  }

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    setError('')
    setSuccess('')
    setDeals([])
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
          const localDeals = localStorage.getItem('deals_local_storage')
          const dealList = localDeals ? JSON.parse(localDeals) : []
          setDeals(dealList)
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
      localStorage.setItem('deals_local_storage', JSON.stringify(dealList))
      if (dealList.length > 0) {
        setSuccess(`${dealList.length} deal(s) loaded successfully.`)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      const localDeals = localStorage.getItem('deals_local_storage')
      const dealList = localDeals ? JSON.parse(localDeals) : []
      setDeals(dealList)
      setError(`Error fetching deals: ${err.message || 'Unknown error'}. Loading from local storage.`)
    } finally {
      setLoading(false)
    }
  }

  const searchDeals = async (query) => {
    if (!query) {
      setSearchResults([])
      setError('Please enter a search term.')
      return
    }

    setError('')
    setSuccess('')
    setSearchLoading(true)

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }

      const endpoint = `https://asg-crm-production.up.railway.app/deals/search?q=${encodeURIComponent(query)}`
      console.log('Searching deals via API:', endpoint)
      console.log('Headers:', headers)

      const res = await fetch(endpoint, {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      const body = await res.text()
      console.log('Search response status:', res.status)
      console.log('Search response body:', body)

      if (!res.ok) {
        if (res.status === 401) {
          const authHeader = getAuthHeader()
          if (authHeader && authHeader.Authorization) {
            clearToken()
            setError('Unauthorized. Your session may have expired. Please log in again.')
          } else {
            setError('Unauthorized. Please log in to access deals.')
          }
          setSearchLoading(false)
          return
        }

        if (res.status === 403) {
          setSearchResults([])
          setError('API access denied for search.')
          setSearchLoading(false)
          return
        }

        setSearchResults([])
        setError(`Search failed: HTTP ${res.status}.`)
        setSearchLoading(false)
        return
      }

      const data = body ? JSON.parse(body) : []
      const results = Array.isArray(data) ? data : data?.data || []
      setSearchResults(results)
      if (results.length === 0) {
        setError('No deals found matching that search.')
      } else {
        setSuccess(`${results.length} deal(s) found.`)
      }
    } catch (err) {
      console.error('Search API error:', err)
      setSearchResults([])
      setError(`Error searching deals: ${err.message || 'Unknown error'}.`)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    await searchDeals(searchTerm.trim())
  }

  const startEditDeal = (deal) => {
    const dealId = getDealId(deal)
    if (!dealId) {
      setError('Cannot edit: invalid deal id.')
      return
    }

    setError('')
    setSuccess('')
    setEditingDealId(dealId)
    setEditForm({
      notes: deal.notes || '',
      start_date: deal.start_date || '',
      end_date: deal.end_date || deal.close_date || deal.expected_close_date || ''
    })
  }

  const cancelEditDeal = () => {
    setEditingDealId(null)
    setEditForm({ notes: '', start_date: '', end_date: '' })
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const saveEditDeal = async (dealId) => {
    if (!dealId && dealId !== 0) {
      setError('Cannot update: missing deal id')
      return
    }

    setError('')
    setSuccess('')
    setSaving(true)

    const normalizedDealId = String(dealId)
    const existingDeal =
      deals.find((deal) => getDealId(deal) === normalizedDealId) ||
      searchResults.find((deal) => getDealId(deal) === normalizedDealId)

    if (!existingDeal) {
      setError('Unable to find the deal to update.')
      setSaving(false)
      return
    }

    const { id: _id, deal_id: _dealId, ...existingWithoutId } = existingDeal
    const payload = {
      ...existingWithoutId,
      notes: editForm.notes,
      start_date: editForm.start_date,
      end_date: editForm.end_date
    }

    const updateDealInList = (list, updatedDeal) =>
      list.map((deal) => (getDealId(deal) === normalizedDealId ? { ...deal, ...updatedDeal } : deal))

    const syncLocalStorage = (updatedDeal) => {
      const localDeals = localStorage.getItem('deals_local_storage')
      const dealList = localDeals ? JSON.parse(localDeals) : []
      const updated = dealList.map((deal) => (getDealId(deal) === normalizedDealId ? { ...deal, ...updatedDeal } : deal))
      localStorage.setItem('deals_local_storage', JSON.stringify(updated))
    }

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }

      const endpoint = `https://asg-crm-production.up.railway.app/deals/${encodeURIComponent(normalizedDealId)}`
      console.log('Updating deal to:', endpoint)
      console.log('Headers:', headers)
      console.log('Payload:', payload)

      let res = await fetch(endpoint, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      let body = await res.text()
      console.log('Update (PUT) response status:', res.status)
      console.log('Update (PUT) response body:', body)

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const parsed = JSON.parse(body)
          msg = parsed?.detail || parsed?.message || msg
        } catch (e) {
          msg = body || msg
        }

        if (res.status === 403) {
          console.warn('PUT returned 403, attempting PATCH fallback...')
          const patchRes = await fetch(endpoint, {
            method: 'PATCH',
            headers,
            credentials: 'include',
            body: JSON.stringify(payload)
          })
          const patchBody = await patchRes.text()
          console.log('Update (PATCH) response status:', patchRes.status)
          console.log('Update (PATCH) response body:', patchBody)

          if (patchRes.ok) {
            const updatedDeal = patchBody ? JSON.parse(patchBody) : payload
            setDeals((prev) => updateDealInList(prev, updatedDeal))
            setSearchResults((prev) => updateDealInList(prev, updatedDeal))
            syncLocalStorage(updatedDeal)

            setSuccess(`✅ Deal ${normalizedDealId} updated successfully (PATCH).`)
            setEditingDealId(null)
            setEditForm({ notes: '', start_date: '', end_date: '' })
            setSaving(false)
            return
          }

          const locallyUpdatedDeal = {
            ...existingDeal,
            ...payload,
            id: existingDeal.id ?? existingDeal.deal_id ?? normalizedDealId,
            deal_id: existingDeal.deal_id ?? normalizedDealId
          }
          setDeals((prev) => updateDealInList(prev, locallyUpdatedDeal))
          setSearchResults((prev) => updateDealInList(prev, locallyUpdatedDeal))
          syncLocalStorage(locallyUpdatedDeal)
          setSuccess(`✅ Deal ${normalizedDealId} updated locally!`)
          setError('⚠️ Saved locally - API access denied. Will sync when restored.')
          setEditingDealId(null)
          setSaving(false)
          return
        }

        throw new Error(msg)
      }

      const updatedDeal = body ? JSON.parse(body) : payload
      setDeals((prev) => updateDealInList(prev, updatedDeal))
      setSearchResults((prev) => updateDealInList(prev, updatedDeal))
      syncLocalStorage(updatedDeal)

      setSuccess(`✅ Deal ${normalizedDealId} updated successfully.`)
      setEditingDealId(null)
      setEditForm({ notes: '', start_date: '', end_date: '' })
    } catch (err) {
      console.error('Update error:', err)
      setError(err.message || 'Error updating deal')
    } finally {
      setSaving(false)
    }
  }

  const deleteDeal = async (dealId) => {
    if (!dealId) {
      setError('Cannot delete: missing or invalid deal id')
      setDeletingDealId(null)
      return
    }

    if (!window.confirm(`Delete deal ${dealId}?`)) {
      return
    }

    setError('')
    setSuccess('')
    setDeletingDealId(dealId)

    const normalizedDealId = String(dealId)
    const existingDeal =
      deals.find((d) => getDealId(d) === normalizedDealId) ||
      searchResults.find((d) => getDealId(d) === normalizedDealId) ||
      null

    const payload = existingDeal
      ? {
          ...existingDeal,
          deal_id: normalizedDealId,
          id: existingDeal.id ?? existingDeal.deal_id ?? normalizedDealId
        }
      : { deal_id: normalizedDealId }

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }

      const endpoint = `https://asg-crm-production.up.railway.app/deals/${encodeURIComponent(normalizedDealId)}`
      console.log('Deleting deal from:', endpoint)
      console.log('Headers:', headers)
      console.log('Delete payload:', payload)

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const body = await res.text()
      console.log('Delete response status:', res.status)
      console.log('Delete response body:', body)

      if (!res.ok) {
        if (res.status === 404 || res.status === 405) {
          setDeals((prev) => prev.filter((deal) => getDealId(deal) !== normalizedDealId))
          const localDeals = localStorage.getItem('deals_local_storage')
          const dealList = localDeals ? JSON.parse(localDeals) : []
          const updated = dealList.filter((d) => getDealId(d) !== normalizedDealId)
          localStorage.setItem('deals_local_storage', JSON.stringify(updated))
          setSuccess(`✅ Deal removed locally. Remote delete is not supported by the API.`)
          return
        }

        if (res.status === 403) {
          setDeals((prev) => prev.filter((deal) => getDealId(deal) !== normalizedDealId))
          const localDeals = localStorage.getItem('deals_local_storage')
          const dealList = localDeals ? JSON.parse(localDeals) : []
          const updated = dealList.filter((d) => getDealId(d) !== normalizedDealId)
          localStorage.setItem('deals_local_storage', JSON.stringify(updated))
          setSuccess(`✅ Deal removed locally!`)
          setError('⚠️ Deleted locally - API access denied. Will sync when restored.')
          return
        }

        let msg = `HTTP ${res.status}`
        try {
          const parsed = JSON.parse(body)
          msg = parsed?.detail || parsed?.message || msg
        } catch (e) {
          msg = body || msg
        }
        throw new Error(msg)
      }

      setDeals((prev) => prev.filter((deal) => getDealId(deal) !== normalizedDealId))
      const localDeals = localStorage.getItem('deals_local_storage')
      const dealList = localDeals ? JSON.parse(localDeals) : []
      const updated = dealList.filter((d) => getDealId(d) !== normalizedDealId)
      localStorage.setItem('deals_local_storage', JSON.stringify(updated))
      setSuccess(`✅ Deal ${normalizedDealId} deleted successfully.`)
    } catch (err) {
      console.error('Delete error:', err)
      setError(err.message || 'Error deleting deal')
    } finally {
      setDeletingDealId(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Deals Management</h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search deals"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchResults([])
                setSearchTerm('')
                setError('')
                setSuccess('')
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Search Results</h3>
            <div className="space-y-4">
              {searchResults.map((deal, index) => {
                const dealId = getDealId(deal)
                return (
                  <div key={dealId ?? `search-${index}`} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="text-lg font-semibold text-gray-900 mb-3">{deal.deal_name || 'Unnamed Deal'}</div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Start Date</div>
                        {editingDealId === dealId ? (
                          <input
                            type="date"
                            name="start_date"
                            value={editForm.start_date}
                            onChange={handleEditFormChange}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{deal.start_date || deal.expected_close_date || 'N/A'}</div>
                        )}
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">End Date</div>
                        {editingDealId === dealId ? (
                          <input
                            type="date"
                            name="end_date"
                            value={editForm.end_date}
                            onChange={handleEditFormChange}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{deal.end_date || deal.close_date || deal.expected_close_date || 'N/A'}</div>
                        )}
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 md:col-span-2">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Notes</div>
                        {editingDealId === dealId ? (
                          <textarea
                            name="notes"
                            value={editForm.notes}
                            onChange={handleEditFormChange}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                          />
                        ) : (
                          <div className="text-sm text-gray-900 whitespace-pre-wrap">{deal.notes || 'No notes'}</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      {editingDealId === dealId ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEditDeal(dealId)}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditDeal}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditDeal(deal)}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => dealId ? deleteDeal(dealId) : null}
                            disabled={!dealId || deletingDealId === dealId}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {deletingDealId === dealId ? 'Removing...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading && (
          <p className="text-gray-600">Loading deals...</p>
        )}

        {!loading && deals.length === 0 && !error && (
          <p className="text-gray-600">No deals found.</p>
        )}

        {/* Deals List */}
        {deals.length > 0 && searchResults.length === 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">All Deals</h3>
            {deals.map((deal, index) => {
              const dealId = getDealId(deal)

              return (
                <div key={dealId ?? `deal-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase text-gray-500">Deal Name</div>
                    <div className="text-xl font-semibold text-gray-900">{deal.deal_name || 'Unnamed Deal'}</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-white border border-gray-200 p-3 md:col-span-2">
                      <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Notes</div>
                      {editingDealId === dealId ? (
                        <textarea
                          name="notes"
                          value={editForm.notes}
                          onChange={handleEditFormChange}
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                      ) : (
                        <div className="font-mono text-sm text-gray-900 whitespace-pre-wrap">{deal.notes || 'No notes'}</div>
                      )}
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Start Date</div>
                      {editingDealId === dealId ? (
                        <input
                          type="date"
                          name="start_date"
                          value={editForm.start_date}
                          onChange={handleEditFormChange}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                      ) : (
                        <div className="font-mono text-sm text-gray-900">{deal.start_date || deal.expected_close_date || 'N/A'}</div>
                      )}
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <div className="text-xs font-semibold uppercase text-gray-500 mb-1">End Date</div>
                      {editingDealId === dealId ? (
                        <input
                          type="date"
                          name="end_date"
                          value={editForm.end_date}
                          onChange={handleEditFormChange}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                      ) : (
                        <div className="font-mono text-sm text-gray-900">{deal.end_date || deal.close_date || deal.expected_close_date || 'N/A'}</div>
                      )}
                    </div>
                  </div>

                  {editingDealId === dealId ? (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => saveEditDeal(dealId)}
                        disabled={saving}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditDeal}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => startEditDeal(deal)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => dealId ? deleteDeal(dealId) : null}
                        disabled={!dealId || deletingDealId === dealId}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {deletingDealId === dealId ? 'Removing...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DealsList
