import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    body: {
        username: string;
        shortBio: string;
        goals: string;
        skills: string[];
        industry: string;
        experience: string;
        availability?: string;
    };
    user?: {
        id: string;
        role: "admin" | "mentor" | "mentee";
        email: string;
        username: string;
        industry?: string;
        experience?: string;
        availability?: string;
        mentorId?: string;
    };
}
export declare const completeUserProfiles: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export {};
