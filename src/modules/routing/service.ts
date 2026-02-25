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

    async resolveCoverage(userId: string, topic: string): Promise<CoverageRecommendation | null> {
        console.log(`[RoutingService] Resolving coverage for user ${userId} on topic: "${topic}"`);

        // 1. Check Manual Overrides (CoverageMap)
        const coverageMaps = await prisma.coverageMap.findMany({
            where: { userId }
        });

        if (coverageMaps.length > 0) {
            // 1a. Try Exact/Partial String Match first (Reliable & Fast)
            const directMatch = coverageMaps.find(m => 
                topic.toLowerCase() === m.topic.toLowerCase() || 
                topic.toLowerCase().includes(m.topic.toLowerCase())
            );

            if (directMatch) {
                console.log(`[RoutingService] ✅ Direct match found for topic: ${directMatch.topic}`);
                return await this.buildRecommendation(directMatch, topic);
            }

            // 1b. Fallback to LLM Semantic Match
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
                        console.log(`[RoutingService] 🎯 LLM matched coverage: ${match.topic}`);
                        return await this.buildRecommendation(match, topic, true);
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

    /**
     * Build a recommendation object from a CoverageMap entry.
     */
    private async buildRecommendation(match: any, originalTopic: string, isLLMMatch = false): Promise<CoverageRecommendation | null> {
        // Try to find a real User if contactId is an ID
        let contactUser = null;
        if (match.contactId.length > 20) { // Likely a cuid
            contactUser = await prisma.user.findUnique({ where: { id: match.contactId } });
        }

        const name = contactUser?.name || match.contactId;
        const email = contactUser?.email || match.contactEmail || '';

        return {
            contact: {
                id: contactUser?.id || match.contactId,
                name: name,
                email: email,
                role: 'Designated Coverage'
            },
            confidence: isLLMMatch ? 0.9 : 1.0,
            reason: isLLMMatch
                ? `LLM matched topic "${originalTopic}" to coverage rule for "${match.topic}"`
                : `Topic "${originalTopic}" matched rule for "${match.topic}"`
        };
    }
}
