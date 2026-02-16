import { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: "admin" | "mentor" | "mentee";
                username: string;
                email: string;
                mentorId?: string;
                menteeId?: string;
                adminId?: string;
            };
        }
    }
}
export declare const authenticateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
