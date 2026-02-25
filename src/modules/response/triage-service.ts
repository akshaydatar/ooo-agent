export type TriageResult = {
    actionable: boolean;
    reason?: string;
    category?: 'noise' | 'automated' | 'social' | 'personal';
};

/**
 * TriageService
 * Performs low-cost local analysis to filter out "noise" before hitting expensive LLMs.
 */
export class TriageService {
    private static NOISE_KEYWORDS = [
        'unsubscribe', 'view in browser', 'no-reply', 'noreply', 
        'newsletter', 'promotions', 'digest', 'weekly update'
    ];

    private static AUTOMATED_PATTERNS = [
        /confirm your/i, /your order/i, /security alert/i, /sign-in from/i,
        /password reset/i, /verification code/i
    ];

    /**
     * Quickly determines if an email warrants an AI-generated contextual response.
     */
    static analyze(sender: string, subject: string, body: string): TriageResult {
        const lowerSubject = subject.toLowerCase();
        const lowerBody = body.toLowerCase();
        const lowerSender = sender.toLowerCase();

        // 1. Filter out obvious automated senders
        if (this.NOISE_KEYWORDS.some(kw => lowerSender.includes(kw) || lowerSubject.includes(kw))) {
            return { actionable: false, reason: 'Automated/Newsletter sender', category: 'noise' };
        }

        // 2. Filter out very short "social" or "thanks" emails (optional, but helps save tokens)
        const wordCount = body.trim().split(/\s+/).length;
        if (wordCount < 5 && (lowerBody.includes('thanks') || lowerBody.includes('thank you') || lowerBody.includes('got it'))) {
             return { actionable: false, reason: 'Short polite response/acknowledgment', category: 'social' };
        }

        // 3. Automated Patterns
        if (this.AUTOMATED_PATTERNS.some(regex => regex.test(lowerSubject) || regex.test(lowerBody))) {
            return { actionable: false, reason: 'System/Transactional notification', category: 'automated' };
        }

        // 4. Threading check: If subject starts with "Re:" it's likely a conversation
        // Conversations are almost always actionable unless they are newsletters.
        if (lowerSubject.startsWith('re:')) {
            return { actionable: true };
        }

        // Default to actionable for safety, but we've filtered the bulk of the noise
        return { actionable: true };
    }
}
