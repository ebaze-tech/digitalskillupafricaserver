import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: 'admin' | 'mentor' | 'mentee';
        email: string;
        username: string;
    };
}
export declare const getUserProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateUserProfile: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
