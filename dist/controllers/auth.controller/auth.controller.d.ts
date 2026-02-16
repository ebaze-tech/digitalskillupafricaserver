import { Request, Response } from 'express';
/**
 * POST /register
 */
export declare const register: (req: Request, res: Response) => Promise<void>;
/**
 * POST /login
 */
export declare const login: (req: Request, res: Response) => Promise<void>;
/**
 * POST /forgot-password
 */
export declare const forgotPassword: (req: Request, res: Response) => Promise<void>;
/**
 * POST /reset-password
 */
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
