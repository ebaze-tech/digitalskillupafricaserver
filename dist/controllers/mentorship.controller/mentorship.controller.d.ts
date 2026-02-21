import { Request, Response } from 'express';
interface UserPayload {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'mentor' | 'mentee';
    roleId: string;
    skils?: string[];
    shortBio?: string;
    goals?: string;
    industry?: string;
    experience?: string;
    availability?: string;
    mentorId?: string;
    menteeId?: string;
}
interface AuthenticatedRequest extends Request {
    user?: UserPayload;
}
export declare const getMentors: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMentorById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMenteeById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createRequest: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const listIncomingRequests: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const respondToRequest: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMenteeRequestToMentor: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const setAvailability: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAvailability: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const clearAvailability: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const bookSession: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const listUpcomingSessionsForMentor: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const listUpcomingSessionsForMentee: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getAssignedMentees: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
