import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const generateToken: (user: {
    id: string;
    username: string;
    role: string;
}) => string;
//# sourceMappingURL=auth.d.ts.map