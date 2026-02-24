import type { CoverageRecommendation } from './types';
import { prisma } from '@/lib/db';
import { ContextService } from '../context/service';
import { LLMProviderFactory, LLMProvider } from '@/lib/llm';

export class RoutingService {
    private contextService: ContextService;
    private llm: LLMProvider;

    constructor() {
        this.contextService = new ContextService();
        this.llm = LLMProviderFactory.getProvider();
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

        if (coverageMaps.length > 0) {
            const mapTopics = coverageMaps.map(m => m.topic).filter(Boolean);
            if (mapTopics.length > 0) {
                const prompt = `Given the incoming email subject or topic: "${topic}", which of the following coverage areas does it best match?
Coverage Areas: ${mapTopics.join(', ')}

Reply ONLY with the exact name of the best matching coverage area. If it clearly matches none of them, reply strictly with "NONE".`;

                const classification = await this.llm.generate({
                    systemPrompt: "You are a specialized routing assistant. You must classify the incoming topic strictly into one of the provided Coverage Areas.",
                    userPrompt: prompt
                });

                const matchedTopic = classification.content.trim();

                if (matchedTopic && matchedTopic.toUpperCase() !== "NONE") {
                    const match = coverageMaps.find(m => m.topic.toLowerCase() === matchedTopic.toLowerCase() || matchedTopic.toLowerCase().includes(m.topic.toLowerCase()));
                    if (match) {
                        const contact = await prisma.user.findUnique({ where: { id: match.contactId } });
                        if (contact) {
                            console.log(`[RoutingService] 🎯 LLM matched coverage: ${match.topic} -> ${contact.email}`);
                            return {
                                contact: {
                                    id: contact.id,
                                    name: contact.name || 'Unknown',
                                    email: contact.email || '',
                                    role: 'Designated Coverage'
                                },
                                confidence: 0.9,
                                reason: `LLM semantic matched topic "${topic}" to coverage rule for "${match.topic}"`
                            };
                        }
                    }
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
