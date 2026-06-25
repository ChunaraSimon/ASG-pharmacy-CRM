import React, { useState, useEffect } from 'react'
import { getAuthHeader, getToken, clearToken } from '../utils/auth'

const fallbackSampleCalls = [
  {
    id: 0,
    client_id: 0,
    existing_product_id: 0,
    lead_status: 'string',
    remarks: 'string',
    follow_up_date: '2026-06-22',
    created_date: '2026-06-22',
    created_time: '08:15:37.491Z'
  }
]

const Calls = () => {
  const [callLogs, setCallLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [deletingClientId, setDeletingClientId] = useState(null)
  const [postingHistoryId, setPostingHistoryId] = useState(null)
  const [activeHistoryCallId, setActiveHistoryCallId] = useState(null)
  const [historyResponse, setHistoryResponse] = useState(null)
  const [editingCallId, setEditingCallId] = useState(null)
  const [editForm, setEditForm] = useState({ lead_status: '', remarks: '' })
  const [clientNames, setClientNames] = useState({})

  useEffect(() => {
    fetchCallLogs()
  }, [])

  const fetchClientName = async (clientIdToFetch) => {
    if (!clientIdToFetch && clientIdToFetch !== 0) return
    if (clientNames[clientIdToFetch]) return

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }

      const endpoint = `https://asg-crm-production.up.railway.app/clients/${encodeURIComponent(clientIdToFetch)}`
      console.log('Fetching client name from:', endpoint)

      const res = await fetch(endpoint, {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      if (!res.ok) {
        console.warn(`Unable to fetch client ${clientIdToFetch}. Status: ${res.status}`)
        return
      }

      const data = await res.json().catch(() => null)
      if (data && (data.pharmacy_name || data.name)) {
        setClientNames((prev) => ({ ...prev, [clientIdToFetch]: data.pharmacy_name || data.name }))
      }
    } catch (err) {
      console.error('Fetch client name error:', err)
    }
  }

  const searchCallLogs = async (query) => {
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

      const paramNames = ['q', 'search', 'query', 'term']
      let results = []
      let lastError = null
      let usedParam = null

      for (const paramName of paramNames) {
        const url = new URL('https://asg-crm-production.up.railway.app/call-logs/search')
        url.searchParams.set(paramName, query.trim())
        console.log('Trying call log search with:', url.toString())

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers,
          credentials: 'include'
        })

        const body = await res.text()
        console.log(`Search (${paramName}) status:`, res.status)
        console.log(`Search (${paramName}) body:`, body)

        if (!res.ok) {
          let msg = `HTTP ${res.status}`
          try {
            const parsed = JSON.parse(body)
            msg = parsed?.detail || parsed?.message || msg
          } catch (e) {
            msg = body || msg
          }
          lastError = msg
          continue
        }

        const data = body ? JSON.parse(body) : []
        const parsedResults = Array.isArray(data) ? data : data?.data || []
        if (parsedResults.length > 0) {
          results = parsedResults
          usedParam = paramName
          break
        }
        if (results.length === 0) {
          results = parsedResults
          usedParam = paramName
        }
      }

      if (results.length === 0 && !usedParam && lastError) {
        throw new Error(lastError)
      }

      if (results.length === 0) {
        const fallbackLogs = callLogs.length ? callLogs : await fetchCallLogs() || []
        const normalizedQuery = query.trim().toLowerCase()
        const localResults = (callLogs.length ? callLogs : fallbackLogs).filter((call) => {
          const id = (call.id ?? call.call_log_id ?? '').toString().toLowerCase()
          const clientId = (call.client_id ?? call.clientId ?? '').toString().toLowerCase()
          const text = [
            call.lead_status,
            call.leadStatus,
            call.remarks,
            call.remark,
            call.follow_up_date,
            call.created_date,
            call.created_time,
            call.pharmacy_name,
            call.pharmacyName,
            call.client_name,
            call.name
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return id === normalizedQuery || clientId === normalizedQuery || text.includes(normalizedQuery)
        })

        if (localResults.length > 0) {
          results = localResults
          setSearchResults(results)
          setSuccess(`${results.length} local call log record(s) found as a fallback.`)
          return
        }
      }

      setSearchResults(results)
      if (results.length === 0) {
        setError('No call log found matching that search.')
      } else {
        setSuccess(`${results.length} call log record(s) found.`)
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message || 'Error searching call logs')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    await searchCallLogs(searchTerm.trim())
  }

  useEffect(() => {
    const ids = Array.from(
      new Set(
        callLogs
          .map((call) => call.client_id || call.clientId)
          .filter((id) => id !== undefined && id !== null && id !== '')
      )
    )

    ids.forEach((id) => {
      if (!clientNames[id]) {
        fetchClientName(id)
      }
    })
  }, [callLogs, clientNames])

  const fetchCallLogs = async () => {
    setError('')
    setSuccess('')
    setCallLogs([])
    setLoading(true)

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }

      const endpoint = 'https://asg-crm-production.up.railway.app/call-logs'
      console.log('Fetching calls from:', endpoint)
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
            setError('Unauthorized. Please log in to access call logs.')
          }
          setCallLogs(fallbackSampleCalls)
          return
        }

        throw new Error(msg)
      }

      const data = body ? JSON.parse(body) : []
      const callList = Array.isArray(data) ? data : data?.data || []
      setCallLogs(callList)
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err.message || 'Error fetching call logs')
    } finally {
      setLoading(false)
    }
  }

  const startEditCallLog = (call) => {
    setError('')
    setSuccess('')
    setEditingCallId(call.id ?? call.call_log_id)
    setEditForm({
      lead_status: call.lead_status || call.leadStatus || '',
      remarks: call.remarks || call.remark || ''
    })
  }

  const cancelEditCallLog = () => {
    setEditingCallId(null)
    setEditForm({ lead_status: '', remarks: '' })
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const saveCallLogEdit = async (callLogId) => {
    if (!callLogId && callLogId !== 0) {
      setError('Cannot update: missing call log id')
      return
    }

    setError('')
    setSuccess('')
    setSaving(true)

    const existingCall = callLogs.find((call) => call.id === callLogId || call.call_log_id === callLogId)
    if (!existingCall) {
      setError('Unable to find the call log to update.')
      setSaving(false)
      return
    }

    const payload = {
      ...existingCall,
      lead_status: editForm.lead_status,
      remarks: editForm.remarks
    }

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }

      const endpoint = `https://asg-crm-production.up.railway.app/call-logs/${encodeURIComponent(callLogId)}`
      console.log('Updating call log to:', endpoint)
      console.log('Headers:', headers)
      console.log('Payload:', payload)

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const body = await res.text()
      console.log('Update response status:', res.status)
      console.log('Update response body:', body)

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const parsed = JSON.parse(body)
          msg = parsed?.detail || parsed?.message || msg
        } catch (e) {
          msg = body || msg
        }
        throw new Error(msg)
      }

      const updatedCall = body ? JSON.parse(body) : payload
      setCallLogs((prev) => prev.map((call) => {
        const idKey = call.id ?? call.call_log_id
        if (idKey !== callLogId) return call
        return { ...call, ...updatedCall }
      }))
      setSuccess(`Call log ${callLogId} updated successfully.`)
      setEditingCallId(null)
      setEditForm({ lead_status: '', remarks: '' })
    } catch (err) {
      console.error('Update error:', err)
      setError(err.message || 'Error updating call log')
    } finally {
      setSaving(false)
    }
  }

  const deleteCallLog = async (callLogId) => {
    if (!callLogId && callLogId !== 0) {
      setError('Cannot delete: missing call log id')
      return
    }

    if (!window.confirm(`Delete call log ${callLogId}?`)) {
      return
    }

    setError('')
    setSuccess('')
    setDeletingClientId(callLogId)

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }

      const endpoint = `https://asg-crm-production.up.railway.app/call-logs/${encodeURIComponent(callLogId)}`
      console.log('Deleting call log from:', endpoint)
      console.log('Headers:', headers)

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      const body = await res.text()
      console.log('Delete response status:', res.status)
      console.log('Delete response body:', body)

      if (!res.ok) {
        if (res.status === 404 || res.status === 405) {
          setCallLogs((prev) => prev.filter((call) => call.id !== callLogId))
          setSuccess(`Call log removed locally. Remote delete is not supported by the API.`)
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

      setCallLogs((prev) => prev.filter((call) => call.id !== callLogId))
      setSuccess(`Call log ${callLogId} deleted successfully.`)
    } catch (err) {
      console.error('Delete error:', err)
      setError(err.message || 'Error deleting call log')
    } finally {
      setDeletingClientId(null)
    }
  }

  const sendCallLogHistory = async (call) => {
    const clientId = call.client_id ?? call.clientId
    if (clientId === undefined || clientId === null) {
      setError('Cannot load history: missing client_id')
      return
    }

    const callLogId = call.id ?? call.call_log_id ?? 0
    const currentHistoryKey = `${clientId}-${callLogId}`

    if (activeHistoryCallId === currentHistoryKey) {
      setActiveHistoryCallId(null)
      setHistoryResponse(null)
      setSuccess('History closed.')
      return
    }

    setError('')
    setSuccess('')
    setHistoryResponse(null)
    setPostingHistoryId(currentHistoryKey)
    setActiveHistoryCallId(currentHistoryKey)

    try {
      const tokenHeader = apiToken ? { Authorization: `Bearer ${apiToken}` } : getAuthHeader()
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader
      }
      const url = new URL(`https://asg-crm-production.up.railway.app/clients/${encodeURIComponent(clientId)}/call-log-history`)
      if (callLogId) {
        url.searchParams.set('call_log_id', callLogId)
      }
      console.log('Loading history from:', url.toString())
      console.log('Call object:', call)

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers,
        credentials: 'include'
      })

      const body = await res.text()
      console.log('History response status:', res.status)
      console.log('History response body:', body)

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const parsed = JSON.parse(body)
          msg = parsed?.detail || parsed?.message || msg
        } catch (e) {
          msg = body || msg
        }
        throw new Error(msg)
      }

      const parsedHistory = body ? JSON.parse(body) : null
      setHistoryResponse(parsedHistory)
      setSuccess(`History loaded for client ${clientId}.`)
    } catch (err) {
      console.error('History load error:', err)
      setError(err.message || 'Error loading call history')
    } finally {
      setPostingHistoryId(null)
    }
  }

  // helper removed: history records will display current field values only

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Call Logs</h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-semibold">Error: {error}</p>
            {error.includes('401') && (
              <p className="mt-2 text-sm text-red-700">
                Unauthorized. The API requires a valid token.
                Showing sample call data for preview.
              </p>
            )}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {historyResponse && (() => {
          const records = Array.isArray(historyResponse)
            ? historyResponse
            : Array.isArray(historyResponse.data)
              ? historyResponse.data
              : [historyResponse]

          if (records.length === 0) {
            return (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg">
                <div className="font-semibold">History Response</div>
                <p className="text-sm">No history records returned.</p>
              </div>
            )
          }

          return (
            <div className="mb-6">
              <div className="mb-3 font-semibold text-blue-900">History Records</div>
              <div className="space-y-4">
                {records.map((record, index) => {
                  const id = record.id ?? record.call_log_id ?? record.client_id ?? index
                  return (
                    <div key={id} className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="grid gap-3 md:grid-cols-2">
                        {(() => {
                          const excludedKeys = new Set([
                            // id variants
                            'id', 'ID', 'client_id', 'clientId', 'clientid', 'client', 'call_log_id', 'callLogId', 'call_logId', 'call_log', 'callLog',
                            // metadata / previous/new change wrappers
                            'old', 'new', 'previous', 'before', 'prev', 'changes',
                            // specific old/new fields
                            'remarks_old', 'remarks_new', 'lead_status_old', 'lead_status_new',
                            // remove existing product id and lead status keys
                            'existing_product_id', 'existingProductId', 'existingproductid', 'existing_product', 'existingproduct',
                            'lead_status', 'leadStatus', 'leadstatus'
                          ])

                          return Object.entries(record)
                            .filter(([field]) => !excludedKeys.has(field))
                            .map(([field, value]) => (
                              <div key={field} className="rounded-lg bg-white border border-gray-200 p-3">
                                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{field.replace(/_/g, ' ')}</div>
                                <div className="text-sm text-gray-900 whitespace-pre-wrap">{value === null || value === undefined ? 'N/A' : String(value)}</div>
                              </div>
                            ))
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Search Results</h3>
            <div className="space-y-4">
              {searchResults.map((call) => {
                const rawClientId = call.client_id || call.clientId
                const pharmacyName = clientNames[rawClientId] || call.pharmacyName || call.client_name || call.pharmacy_name || 'Unknown pharmacy'
                const leadStatus = call.lead_status || call.leadStatus || 'N/A'
                const remarks = call.remarks || call.remark || 'N/A'
                return (
                  <div key={call.id ?? call.call_log_id ?? `${rawClientId}-${call.created_time}`} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="text-lg font-semibold text-gray-900">{pharmacyName}</div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">ID</div>
                        <div className="text-sm text-gray-900">{call.id ?? call.call_log_id ?? 'N/A'}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Lead Status</div>
                        <div className="text-sm text-gray-900">{leadStatus}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Remarks</div>
                        <div className="text-sm text-gray-900">{remarks}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Follow Up Date</div>
                        <div className="text-sm text-gray-900">{call.follow_up_date || 'N/A'}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Created Date</div>
                        <div className="text-sm text-gray-900">{call.created_date || 'N/A'}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Created Time</div>
                        <div className="text-sm text-gray-900">{call.created_time || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => sendCallLogHistory(call)}
                        disabled={postingHistoryId === `${rawClientId}-${call.id ?? call.call_log_id ?? 0}`}
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {activeHistoryCallId === `${rawClientId}-${call.id ?? call.call_log_id ?? 0}` ? 'Hide History' : postingHistoryId === `${rawClientId}-${call.id ?? call.call_log_id ?? 0}` ? 'Sending...' : 'History'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading && (
          <p className="text-gray-600">Loading call logs...</p>
        )}

        {!loading && callLogs.length === 0 && !error && (
          <p className="text-gray-600">No call logs found.</p>
        )}

        {callLogs.length > 0 && (
          <div className="space-y-4">
            {callLogs.map((call) => {
              const rawClientId = call.client_id || call.clientId
              const fetchedName = rawClientId ? clientNames[rawClientId] : null
              const pharmacyName = fetchedName || call.pharmacyName || call.client_name || call.pharmacy_name || 'Unknown pharmacy'
              const leadStatus = call.lead_status || call.leadStatus || 'N/A'
              const remarks = call.remarks || call.remark || 'N/A'

              return (
                <div key={call.id ?? `${rawClientId}-${call.created_time}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase text-gray-500">Pharmacy</div>
                    <div className="text-xl font-semibold text-gray-900">{pharmacyName}</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Lead Status</div>
                      {editingCallId === call.id || editingCallId === call.call_log_id ? (
                        <input
                          type="text"
                          name="lead_status"
                          value={editForm.lead_status}
                          onChange={handleEditFormChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                      ) : (
                        <div className="font-mono text-sm text-gray-900 wrap-break-word">{leadStatus}</div>
                      )}
                    </div>
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Remarks</div>
                      {editingCallId === call.id || editingCallId === call.call_log_id ? (
                        <textarea
                          name="remarks"
                          value={editForm.remarks}
                          onChange={handleEditFormChange}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                      ) : (
                        <div className="font-mono text-sm text-gray-900 wrap-break-word">{remarks}</div>
                      )}
                    </div>
                  </div>
                  {editingCallId === call.id || editingCallId === call.call_log_id ? (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => saveCallLogEdit(call.id ?? call.call_log_id)}
                        disabled={saving}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditCallLog}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => startEditCallLog(call)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => sendCallLogHistory(call)}
                        disabled={postingHistoryId === `${rawClientId}-${call.id ?? call.call_log_id ?? 0}`}
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {activeHistoryCallId === `${rawClientId}-${call.id ?? call.call_log_id ?? 0}` ? 'Hide History' : postingHistoryId === `${rawClientId}-${call.id ?? call.call_log_id ?? 0}` ? 'Sending...' : 'History'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCallLog(call.id ?? rawClientId)}
                        disabled={deletingClientId === call.id || deletingClientId === rawClientId}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {deletingClientId === call.id || deletingClientId === rawClientId ? 'Removing...' : 'Remove'}
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

export default Calls
