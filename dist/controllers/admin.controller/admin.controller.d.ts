import { Request, Response } from 'express';
/**
 * GET /users
 */
export declare const getAllUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /sessions/stats
 */
export declare const getSessionStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /mentorship/assign
 *
 */
export declare const assignMentorToMentee: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /users
 * Centralized user creation
 */
export declare const addUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PATCH /users/:id
 */
export declare const editUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
