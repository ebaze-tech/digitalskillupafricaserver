/**
 * Interface for mentor search results
 */
export interface MentorProfile {
    id: string;
    username: string;
    email: string;
    industry: string;
    experience: string;
    availability: string;
    shortBio: string;
    skills: string[];
}
/**
 * Finds mentors with optional filtering by skill name or industry.
 */
export declare const findMentors: (skill?: string, industry?: string) => Promise<MentorProfile[]>;
