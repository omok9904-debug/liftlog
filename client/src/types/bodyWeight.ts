export type BodyWeightEntry = {
  _id: string
  weight: number
  date: string
  createdAt?: string
}

export type BodyWeightCreatePayload = {
  weight: number
  date: string
}

export type BodyWeightUpdatePayload = {
  weight?: number
  date?: string
}
