export interface Contact {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface RoutingHeuristic {
    docVolume: number; // 0-1 normalized Score based on docs authored
    emailFrequency: number; // 0-1 normalized Score based on email threads
}

export interface CoverageRecommendation {
    contact: Contact;
    confidence: number;
    reason: string; // "High volume of edits on 'Project X' docs"
}
