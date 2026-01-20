import { http } from '@/services/http'
import type {
  BodyWeightCreatePayload,
  BodyWeightEntry,
  BodyWeightUpdatePayload,
} from '@/types/bodyWeight'

type DeleteResponse = {
  message: string
  id: string
}

export const weightService = {
  async getAll() {
    const res = await http.get<BodyWeightEntry[]>('/weights')
    return res.data
  },

  async create(payload: BodyWeightCreatePayload) {
    const res = await http.post<BodyWeightEntry>('/weights', payload)
    return res.data
  },

  async update(id: string, payload: BodyWeightUpdatePayload) {
    const res = await http.put<BodyWeightEntry>(`/weights/${id}`, payload)
    return res.data
  },

  async remove(id: string) {
    const res = await http.delete<DeleteResponse>(`/weights/${id}`)
    return res.data
  },
}
