import { Request, Response, NextFunction } from "express";
import { authorizeService, tokenService, userInfoService, tokenIntrospectionService, refreshTokenService } from "../service/oidc.service.js"

const authorizeController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await authorizeService(req, res);
    } catch (error) {
        next(error);
    }
}

const tokenController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await tokenService(req, res);
    } catch (error) {
        next(error);
    }
}

const userInfoController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userInfoService(req, res);
    } catch (error) {
        next(error);
    }
}

const tokenIntrospectionController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await tokenIntrospectionService(req, res);
    } catch (error) {
        next(error);
    }
}

const refreshTokenController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await refreshTokenService(req, res);
    } catch (error) {
        next(error);
    }
}

export { authorizeController, tokenController, userInfoController, tokenIntrospectionController, refreshTokenController }