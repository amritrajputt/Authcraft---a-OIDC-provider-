import { Request, Response,NextFunction } from "express";
import { registerClient } from '../service/client.service.js'

const clientController = async (req: Request, res: Response,next:NextFunction) => {
    try {
        const { app_name, redirect_uri } = req.body;
        const response = await registerClient({app_name, redirect_uri});
        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
}

export { clientController }