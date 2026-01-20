import { http } from '@/services/http'

export type AuthUser = {
  id: string
  email: string
  isAdmin?: boolean
}

type AuthResponse = {
  user: AuthUser
}

type LoginPayload = {
  email: string
  password: string
  remember?: boolean
}

type SignupPayload = {
  email: string
  password: string
  remember?: boolean
}

type VerifyAdminPayload = {
  key: string
}

export const authService = {
  async signup(payload: SignupPayload) {
    const res = await http.post<AuthResponse>('/auth/signup', payload, { withCredentials: true })
    return res.data.user
  },

  async login(payload: LoginPayload) {
    const res = await http.post<AuthResponse>('/auth/login', payload, { withCredentials: true })
    return res.data.user
  },

  async logout() {
    await http.post('/auth/logout')
  },

  async me() {
    const res = await http.get<AuthResponse>('/auth/me')
    return res.data.user
  },

  async verifyAdmin(payload: VerifyAdminPayload) {
    await http.post('/auth/admin/verify', { ...payload, remember: false })
  },
}
