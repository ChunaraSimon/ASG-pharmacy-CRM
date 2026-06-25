export const saveToken = (accessToken, tokenType = 'Bearer') => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('token_type', tokenType)
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    const secure = window.location.protocol === 'https:'
    const sameSite = secure ? 'None' : 'Lax'
    const secureFlag = secure ? '; Secure' : ''

    document.cookie = `access_token=${encodeURIComponent(accessToken)}; expires=${expires.toUTCString()}; path=/; SameSite=${sameSite}${secureFlag}`
    document.cookie = `token_type=${encodeURIComponent(tokenType)}; expires=${expires.toUTCString()}; path=/; SameSite=${sameSite}${secureFlag}`
  }
}

export const saveRole = (role) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_role', role)
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    document.cookie = `user_role=${encodeURIComponent(role)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  }
}

export const getRole = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('user_role') || getCookieValue('user_role')
}

export const clearRole = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_role')
    document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
}

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('token_type')
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'token_type=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
}

const getCookieValue = (name) => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export const getToken = () => {
  if (typeof window === 'undefined') return null
  const accessToken = localStorage.getItem('access_token') || getCookieValue('access_token')
  const tokenType = localStorage.getItem('token_type') || getCookieValue('token_type')
  return accessToken ? { accessToken, tokenType } : null
}

export const hasAuth = () => {
  return Boolean(getToken())
}

export const getAuthHeader = () => {
  const tokenData = getToken()
  if (!tokenData) return {}
  const type = tokenData.tokenType || 'Bearer'
  return { Authorization: `${type} ${tokenData.accessToken}` }
}
