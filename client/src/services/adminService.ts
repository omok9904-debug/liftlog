import { http } from '@/services/http'

export type AdminUserRow = {
  _id: string
  email: string
  createdAt: string
  weightEntriesCount: number
}

type ListUsersResponse = {
  users: AdminUserRow[]
}

export const adminService = {
  async listUsers() {
    const res = await http.get<ListUsersResponse>('/admin/users')
    return res.data.users
  },

  async deleteUser(id: string) {
    const res = await http.delete<{ message: string; id: string }>(`/admin/users/${id}`)
    return res.data
  },
}
