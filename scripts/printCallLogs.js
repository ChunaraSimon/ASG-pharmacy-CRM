// Simple Node script to fetch call logs and print selected fields
(async () => {
  try {
    const token = process.env.CALLS_API_TOKEN || process.env.ACCESS_TOKEN || ''
    const headers = { Accept: 'application/json' }
    if (token) headers.Authorization = token.startsWith('Bearer') ? token : `Bearer ${token}`

    const res = await fetch('https://asg-crm-production.up.railway.app/call-logs', {
      method: 'GET',
      headers
    })

    if (!res.ok) {
      console.error('Request failed:', res.status, res.statusText)
      const text = await res.text().catch(() => '')
      console.error('Body:', text)
      process.exitCode = 1
      return
    }

    const data = await res.json().catch(() => null)
    const callLogs = Array.isArray(data) ? data : data?.data || []

    if (!Array.isArray(callLogs) || callLogs.length === 0) {
      console.log('No call logs returned from API.')
      return
    }

    for (const call of callLogs) {
      const out = {
        id: call.id ?? call.call_log_id ?? 0,
        client_id: call.client_id ?? 0,
        existing_product_id: call.existing_product_id ?? call.existing_product ?? 0,
        lead_status: call.lead_status ?? call.leadStatus ?? 'string',
        remarks: call.remarks ?? 'string',
        follow_up_date: call.follow_up_date ?? call.followUpDate ?? new Date().toISOString().split('T')[0],
        created_date: call.created_date ?? new Date().toISOString().split('T')[0],
        created_time: call.created_time ?? new Date().toISOString()
      }

      console.log(JSON.stringify(out, null, 2))
    }
  } catch (err) {
    console.error('Error fetching call logs:', err)
    process.exitCode = 1
  }
})()
