export function getApiBaseUrl() {
  const value = import.meta.env.VITE_API_URL
  if (typeof value === 'string' && value.length > 0) return value
  if (import.meta.env.DEV) return 'http://localhost:5050'
  throw new Error('VITE_API_URL is missing')
}
