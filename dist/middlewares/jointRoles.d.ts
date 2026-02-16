import { Request, Response, NextFunction } from "express";
export declare function jointRoles(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
