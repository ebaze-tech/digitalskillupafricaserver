import { Request, Response } from 'express';
/**
 * PATCH /profile/complete
 * Updates the user's core profile and manages skills association.
 */
export declare const completeUserProfiles: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /profile/me
 * Retrieves current user profile with aggregated skills.
 */
export declare const getMyProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
