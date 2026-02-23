"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { RuleCondition, RuleAction, RulesService } from "@/modules/rules/service"
import { auth } from "@/lib/auth"

const rulesService = new RulesService()

// Helper to get authenticated user ID
async function getUserId(): Promise<string> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")
    return session.user.id
}

export async function createRule(data: { name: string, condition: RuleCondition, action: RuleAction }) {
    const userId = await getUserId()
    await rulesService.createRule(userId, data.name, data.condition, data.action, 0)
    revalidatePath('/dashboard/rules')
}

export async function getRules() {
    const userId = await getUserId()
    return await rulesService.getRules(userId)
}

export async function deleteRule(id: string) {
    const userId = await getUserId()
    await rulesService.deleteRule(id, userId)
    revalidatePath('/dashboard/rules')
}
