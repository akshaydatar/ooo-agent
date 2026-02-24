import { prisma } from "@/lib/db";
import { PIIScrubber } from "../response/pii-scrubber";

export class PolicyInterceptor {
    /**
     * Enforces active organizational Data Policies on outgoing responses.
     */
    async enforce(userId: string, targetEmails: string[], content: string): Promise<{ blocked: boolean, reason?: string, cleanContent: string }> {
        let finalContent = content;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { organization: { include: { policies: true } } }
        });

        if (!user?.organization?.policies) {
            // Default safe fallback if no org policies exist
            return { blocked: false, cleanContent: PIIScrubber.redact(content) };
        }

        const policies = user.organization.policies;

        for (const policy of policies) {
            const rules = JSON.parse(policy.rules);
            if (!rules.active) continue;

            if (policy.name === 'Block External Domains') {
                const whitelisted = [user.organization.domain, 'gmail.com', 'example.com']; // Example whitelisted domains
                for (const email of targetEmails) {
                    const domain = email.split('@')[1]?.toLowerCase();
                    if (domain && !whitelisted.includes(domain)) {
                        return {
                            blocked: true,
                            reason: `Policy Violation: Cannot send automated replies to non-whitelisted domain (${domain}).`,
                            cleanContent: finalContent
                        };
                    }
                }
            }

            if (policy.name === 'PII Auto-Redaction') {
                finalContent = PIIScrubber.redact(finalContent);
            }
        }

        return { blocked: false, cleanContent: finalContent };
    }
}
