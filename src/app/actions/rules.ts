"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { RuleCondition, RuleAction, RulesService } from "@/modules/rules/service"

const rulesService = new RulesService()

// Mock User ID for V1
const USER_ID = "test-user-id"

export async function createRule(data: { name: string, condition: RuleCondition, action: RuleAction }) {
    await rulesService.createRule(USER_ID, data.name, data.condition, data.action, 0)
    revalidatePath('/dashboard/rules')
}

export async function getRules() {
    return await rulesService.getRules(USER_ID)
}

export async function deleteRule(id: string) {
    await rulesService.deleteRule(id, USER_ID)
    revalidatePath('/dashboard/rules')
}
