import { ContextService } from '../context/service';
import type { CoverageRecommendation } from './types';

export class RoutingService {
    private contextService: ContextService;

    constructor() {
        this.contextService = new ContextService();
    }

    /**
     * Determine the best coverage person for a given topic.
     */
    async resolveCoverage(topic: string): Promise<CoverageRecommendation | null> {
        console.log(`[RoutingService] Resolving coverage for topic: "${topic}"`);

        // 1. Query Context
        const relevantItems = await this.contextService.query({ query: topic });

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
