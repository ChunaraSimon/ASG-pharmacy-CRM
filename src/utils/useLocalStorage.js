import { useState, useEffect } from 'react'

const isBrowser = typeof window !== 'undefined'

export const useLocalStorageState = (key, defaultValue) => {
  const [state, setState] = useState(() => {
    if (!isBrowser) {
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue
    }

    try {
      const storedValue = window.localStorage.getItem(key)
      if (storedValue !== null) {
        return JSON.parse(storedValue)
      }
    } catch (error) {
      console.error('useLocalStorageState read error', error)
    }

    return typeof defaultValue === 'function' ? defaultValue() : defaultValue
  })

  useEffect(() => {
    if (!isBrowser) return

    try {
      if (state === undefined) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, JSON.stringify(state))
      }
    } catch (error) {
      console.error('useLocalStorageState write error', error)
    }
  }, [key, state])

  return [state, setState]
}
