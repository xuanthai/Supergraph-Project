import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface Context {
  prisma: PrismaClient,
  req: any
}

// export const context: Context = {
//   prisma: prisma,
// }

export function createContext(req: any) {
  return {
    ...req,
    prisma,
  }
}