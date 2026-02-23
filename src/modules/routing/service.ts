import type { CoverageRecommendation } from './types';
import { prisma } from '@/lib/db';
import { ContextService } from '../context/service';

export class RoutingService {
    private contextService: ContextService;

    constructor() {
        this.contextService = new ContextService();
    }

    /**
     * Determine the best coverage person for a given topic.
     * Checks manual overrides (CoverageMap) first, then falls back to Context inference.
     */
    async resolveCoverage(userId: string, topic: string): Promise<CoverageRecommendation | null> {
        console.log(`[RoutingService] Resolving coverage for user ${userId} on topic: "${topic}"`);

        // 1. Check Manual Overrides (CoverageMap)
        const coverageMaps = await prisma.coverageMap.findMany({
            where: { userId }
        });

        for (const map of coverageMaps) {
            // Basic inclusion match for MVP. E.g., topic="Need help with Billing", map.topic="billing"
            if (topic.toLowerCase().includes(map.topic.toLowerCase())) {
                const contact = await prisma.user.findUnique({ where: { id: map.contactId } });
                if (contact) {
                    console.log(`[RoutingService] 🎯 Manual override matched: ${map.topic} -> ${contact.email}`);
                    return {
                        contact: {
                            id: contact.id,
                            name: contact.name || 'Unknown',
                            email: contact.email || '',
                            role: 'Designated Coverage'
                        },
                        confidence: 1.0,
                        reason: `Topic perfectly matches manual coverage rule for "${map.topic}"`
                    };
                }
            }
        }

        // 2. Query Context (Fallback)
        const relevantItems = await this.contextService.query({ userId, query: topic });

        if (relevantItems.length === 0) return null;

        // 2. Aggregate Contributors
        const contributorCounts = new Map<string, number>();

        for (const item of relevantItems) {
            // Safe access to metadata
            const meta = item.metadata as any;
            const person = meta.author || meta.sender;
            if (person) {
                contributorCounts.set(person, (contributorCounts.get(person) || 0) + 1);
            }
        }

        // 3. Find Top Contributor
        let topPerson = '';
        let maxCount = 0;

        contributorCounts.forEach((count, person) => {
            if (count > maxCount) {
                maxCount = count;
                topPerson = person;
            }
        });

        if (!topPerson) return null;

        // 4. Return Recommendation
        return {
            contact: {
                id: topPerson.toLowerCase().replace(' ', '-'),
                name: topPerson,
                email: `${topPerson.toLowerCase().replace(' ', '.')}@example.com`,
                role: 'Contributor'
            },
            confidence: maxCount / relevantItems.length,
            reason: `Identified as frequent contributor (${maxCount} items) on topic "${topic}"`
        };
    }
}
