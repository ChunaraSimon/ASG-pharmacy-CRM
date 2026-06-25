import React, { useState, useEffect } from 'react'
import { getAuthHeader, getToken } from '../utils/auth'

const Client = () => {
  const [formData, setFormData] = useState({
    pharmacyName: '',
    contactPerson: '',
    mobileNo: '',
    email: '',
    leadSource: '',
    address: '',
    cityId: '',
    cityName: '',
    areaId: '',
    areaName: ''
  })
  const [cities, setCities] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [citiesError, setCitiesError] = useState('')
  const [areas, setAreas] = useState([])
  const [areasLoading, setAreasLoading] = useState(false)
  const [areasError, setAreasError] = useState('')
  const LOCAL_STORAGE_KEY = 'clientsPageData'

  const persistClient = async (client) => {
    let saved = null
    try {
      const token = getToken()
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? getAuthHeader() : {})
      }

      // normalize fields: trim strings, set empty to null
      const trim = (v) => (typeof v === 'string' ? v.trim() : v)
      const toNullIfEmpty = (v) => {
        const t = trim(v)
        return t === '' ? null : t
      }

      const rawPharmacy = client.pharmacyName || client.pharmacy_name || client.name || ''
      const rawContact = client.contactPerson || client.contact_person || ''
      const rawMobile = client.mobileNo || client.mobile_no || ''
      const rawEmail = client.email || ''
      const rawLead = client.leadSource || client.lead_source || ''
      const rawAddress = client.address || ''
      const rawCity = client.cityId || client.city_id || null
      const rawArea = client.areaId || client.area_id || null

      // sanitize mobile: keep digits only
      const mobileDigits = String(rawMobile || '').replace(/\D+/g, '')
      const mobileValue = mobileDigits === '' ? null : mobileDigits

      // email basic validation
      const emailValue = toNullIfEmpty(rawEmail)
      if (emailValue && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailValue)) {
        alert('Please enter a valid email address')
        return null
      }

      const payload = {
        pharmacy_name: toNullIfEmpty(rawPharmacy),
        contact_person: toNullIfEmpty(rawContact),
        mobile_no: mobileValue,
        email: emailValue,
        lead_source: toNullIfEmpty(rawLead),
        address: toNullIfEmpty(rawAddress),
        city_id: rawCity ? (Number.isNaN(Number(rawCity)) ? rawCity : Number(rawCity)) : null,
        area_id: rawArea ? (Number.isNaN(Number(rawArea)) ? rawArea : Number(rawArea)) : null
      }

      console.debug('Creating client: POST /clients with headers:', headers)
      console.debug('Creating client: payload:', payload)

      // basic client-side validation
      if (!payload.pharmacy_name) {
        alert('Pharmacy name is required')
        return null
      }

      const response = await fetch('https://asg-crm-production.up.railway.app/clients', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        let parsed = null
        try { parsed = JSON.parse(text) } catch (e) { parsed = text }
        console.warn('Server returned error creating client', response.status, parsed)
        alert(`Create client failed: ${response.status} ${JSON.stringify(parsed)}`)
        return null
      }

      saved = await response.json().catch(() => null)
      if (saved) {
        // try to fetch the authoritative client list from server and store it locally
        try {
          const token = getToken()
          const headers = {
            'Content-Type': 'application/json',
            ...(token ? getAuthHeader() : {})
          }
          const listResp = await fetch('https://asg-crm-production.up.railway.app/clients', {
            method: 'GET',
            headers
          })
          if (listResp.ok) {
            const listData = await listResp.json().catch(() => null)
            if (Array.isArray(listData)) {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(listData))
              try { window.dispatchEvent(new CustomEvent('clients:updated', { detail: listData })) } catch (e) {}
            } else {
              // fallback: prepend saved
              const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
              let existingClients = []
              if (stored) existingClients = JSON.parse(stored) || []
              const updated = [saved, ...existingClients]
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
            }
          } else {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
            let existingClients = []
            if (stored) existingClients = JSON.parse(stored) || []
            const updated = [saved, ...existingClients]
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
            try { window.dispatchEvent(new CustomEvent('clients:updated', { detail: updated })) } catch (e) {}
          }
        } catch (e) {
          console.warn('Unable to refresh client list after create', e)
          try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
            let existingClients = []
            if (stored) existingClients = JSON.parse(stored) || []
            const updated = [saved, ...existingClients]
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
            try { window.dispatchEvent(new CustomEvent('clients:updated', { detail: updated })) } catch (e) {}
          } catch (ee) {
            console.warn('Unable to update local storage after creating client', ee)
          }
        }
        return saved
      }
    } catch (error) {
      console.error('Unable to create client on server', error)
      return null
    }
  }

  useEffect(() => {
    const fetchCities = async () => {
      setCitiesLoading(true)
      setCitiesError('')
      try {
        const response = await fetch('https://asg-crm-production.up.railway.app/cities')
        if (!response.ok) {
          throw new Error('Unable to load cities')
        }

        const data = await response.json()
        setCities(Array.isArray(data) ? data : [])
      } catch (error) {
        setCitiesError(error.message || 'Unable to load cities')
      } finally {
        setCitiesLoading(false)
      }
    }

    fetchCities()
  }, [])

  useEffect(() => {
    if (!formData.cityId) {
      setAreas([])
      return
    }

    const fetchAreas = async () => {
      setAreasLoading(true)
      setAreasError('')
      try {
        const cityId = encodeURIComponent(formData.cityId)
        const response = await fetch(`https://asg-crm-production.up.railway.app/cities/${cityId}/areas`)
        if (!response.ok) {
          throw new Error('Unable to load areas')
        }

        const data = await response.json()
        if (Array.isArray(data)) {
          setAreas(data)
        } else if (Array.isArray(data?.data)) {
          setAreas(data.data)
        } else {
          setAreas([])
          setAreasError('Unexpected area data format')
        }
      } catch (error) {
        setAreas([])
        setAreasError(error.message || 'Unable to load areas')
      } finally {
        setAreasLoading(false)
      }
    }

    fetchAreas()
  }, [formData.cityId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCitySelectChange = (e) => {
    const cityId = e.target.value
    const city = cities.find((c) => String(c.id) === cityId)
    setFormData((prev) => ({
      ...prev,
      cityId,
      cityName: city?.name || '',
      areaId: '',
      areaName: ''
    }))
  }

  const handleCityInputChange = (e) => {
    const cityName = e.target.value
    setFormData((prev) => ({
      ...prev,
      cityId: '',
      cityName,
      areaId: '',
      areaName: ''
    }))
  }

  const handleAreaSelectChange = (e) => {
    const areaId = e.target.value
    const area = areas.find((a) => String(a.id) === areaId)
    setFormData((prev) => ({
      ...prev,
      areaId,
      areaName: area?.name || ''
    }))
  }

  const handleAreaInputChange = (e) => {
    const areaName = e.target.value
    setFormData((prev) => ({
      ...prev,
      areaId: '',
      areaName
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newClient = {
      id: Date.now(),
      pharmacyName: formData.pharmacyName,
      contactPerson: formData.contactPerson,
      mobileNo: formData.mobileNo,
      email: formData.email,
      leadSource: formData.leadSource,
      address: formData.address,
      cityId: formData.cityId,
      cityName: formData.cityName,
      areaId: formData.areaId,
      areaName: formData.areaName
    }
    const result = await persistClient(newClient)
    if (result) {
      alert('Client saved on server successfully')
    } else {
      alert('Unable to save client on server. Check console for details.')
    }
    setFormData({
      pharmacyName: '',
      contactPerson: '',
      mobileNo: '',
      email: '',
      leadSource: '',
      address: '',
      cityId: '',
      cityName: '',
      areaId: '',
      areaName: ''
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Client Lead Form</h1>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div>
            <label htmlFor="pharmacyName" className="block text-sm font-medium text-slate-700 mb-2">
              Pharmacy Name
            </label>
            <input
              type="text"
              id="pharmacyName"
              name="pharmacyName"
              value={formData.pharmacyName}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="Enter pharmacy name"
            />
          </div>

          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700 mb-2">
              Contact Person
            </label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="Enter contact person name"
            />
          </div>

          <div>
            <label htmlFor="mobileNo" className="block text-sm font-medium text-slate-700 mb-2">
              Mobile No
            </label>
            <input
              type="tel"
              id="mobileNo"
              name="mobileNo"
              value={formData.mobileNo}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="Enter mobile number"
            />
          </div>

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
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label htmlFor="leadSource" className="block text-sm font-medium text-slate-700 mb-2">
              Lead Source
            </label>
            <input
              type="text"
              id="leadSource"
              name="leadSource"
              value={formData.leadSource}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="Enter lead source"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="Enter address"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                City
              </label>
              <select
                id="city"
                name="city"
                value={formData.cityId}
                onChange={handleCitySelectChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              >
                <option value="">Select city</option>
                {cities.map((city) => {
                  const cityId = typeof city === 'string' ? city : city.id
                  const cityLabel = typeof city === 'string' ? city : city.name || city.id
                  return (
                    <option key={cityId} value={cityId}>
                      {cityLabel}
                    </option>
                  )
                })}
              </select>
              {citiesLoading && <p className="text-sm text-slate-500 mt-2">Loading cities...</p>}
              {citiesError && <p className="text-sm text-red-500 mt-2">{citiesError}</p>}
            </div>
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-slate-700 mb-2">
                Area
              </label>
              <select
                id="area"
                name="area"
                value={formData.areaId}
                onChange={handleAreaSelectChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                disabled={!formData.cityId}
              >
                <option value="">Select area</option>
                {areas.map((area) => {
                  const areaId = typeof area === 'string' ? area : area.id
                  const areaLabel = typeof area === 'string' ? area : area.name || area.id
                  return (
                    <option key={areaId} value={areaId}>
                      {areaLabel}
                    </option>
                  )
                })}
              </select>
              {areasLoading && <p className="text-sm text-slate-500 mt-2">Loading areas...</p>}
              {areasError && <p className="text-sm text-red-500 mt-2">{areasError}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 rounded-2xl bg-indigo-600 text-white px-6 py-3 font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

export default Client
