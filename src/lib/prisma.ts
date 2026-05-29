import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export function getPrisma() {
    if (!globalForPrisma.prisma) {
        // Prisma 7 reads DATABASE_URL from the environment automatically.
        // No constructor option needed — the env var is the datasource.
        globalForPrisma.prisma = new PrismaClient({
            log: ['error', 'warn'],
        })
    }
    return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
    get(target, prop, receiver) {
        const client = getPrisma()
        return Reflect.get(client, prop, receiver)
    }
})
