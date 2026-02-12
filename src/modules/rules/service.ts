import { prisma } from '@/lib/db';
import { ResponseRule } from '@prisma/client';

export interface RuleCondition {
    type: 'sender' | 'subject' | 'keyword';
    value: string;
}

export interface RuleAction {
    type: 'template' | 'instructions';
    value: string; // Template ID or raw instructions
}

export class RulesService {
    /**
     * Get all rules for a user, ordered by priority (descending).
     */
    async getRules(userId: string): Promise<ResponseRule[]> {
        return prisma.responseRule.findMany({
            where: { userId },
            orderBy: { priority: 'desc' }
        });
    }

    /**
     * Create a new rule.
     */
    async createRule(userId: string, name: string, condition: RuleCondition, action: RuleAction, priority: number = 0): Promise<ResponseRule> {
        return prisma.responseRule.create({
            data: {
                userId,
                name,
                condition: JSON.stringify(condition),
                action: JSON.stringify(action),
                priority
            }
        });
    }

    /**
     * Evaluate rules against an incoming email to find the first matching rule.
     */
    async evaluate(userId: string, email: { sender: string, subject: string, body: string }): Promise<ResponseRule | null> {
        const rules = await this.getRules(userId);

        for (const rule of rules) {
            const condition = JSON.parse(rule.condition) as RuleCondition;
            let isMatch = false;

            switch (condition.type) {
                case 'sender':
                    isMatch = email.sender.toLowerCase().includes(condition.value.toLowerCase());
                    break;
                case 'subject':
                    isMatch = email.subject.toLowerCase().includes(condition.value.toLowerCase());
                    break;
                case 'keyword':
                    isMatch = email.body.toLowerCase().includes(condition.value.toLowerCase());
                    break;
            }

            if (isMatch) {
                console.log(`[RulesService] Match found: "${rule.name}"`);
                return rule;
            }
        }

        return null;
    }

    /**
     * Delete a rule.
     */
    async deleteRule(id: string, userId: string): Promise<void> {
        await prisma.responseRule.deleteMany({
            where: { id, userId }
        });
    }
}
