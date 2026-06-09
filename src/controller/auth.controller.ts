import { Request, Response, NextFunction } from "express";
import * as authService from "../service/auth.service.js";

interface RegisterInput {
    email: string;
    name: string;
    password: string;
}
interface LoginInput {
    email: string;
    password: string;
    client_id: string;
}
const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name, password } = req.body as RegisterInput;
        const response = await authService.register({ email, name, password });
        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
}

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, client_id } = req.body as LoginInput;
        if (email === 'demo@example.com' && client_id !== 'demo-client-id') {
            return res.status(403).json({
                success: false,
                message: "Demo account login is only allowed for the demo client application."
            });
        }
        const response = await authService.login({ email, password });
        req.session.userId = response.data.id;

        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to initialize login session"
                });
            }
            return res.status(response.statusCode).json(response);
        });
    } catch (error) {
        next(error);
    }
}
export { register, login }