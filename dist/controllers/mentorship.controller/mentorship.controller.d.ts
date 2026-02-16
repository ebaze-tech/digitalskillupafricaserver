import { Request, Response } from 'express';
/**
 * GET /mentors
 * Fetch mentors filtered by skill or industry
 */
export declare const getMentors: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /mentorship/request
 * Mentee sends a request to a mentor
 */
export declare const requestMentorship: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /mentorship/requests/incoming
 * Mentor views their pending requests
 */
export declare const getRequests: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PATCH /mentorship/requests/:requestId
 * Mentor accepts or rejects a request
 */
export declare const handleRequestStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /mentorship/mentees
 * Mentor views their currently assigned mentees
 */
export declare const getAssignedMentees: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
