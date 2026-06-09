import crypto from "crypto"
import dotenv from "dotenv"
dotenv.config()
import jwt, { SignOptions } from "jsonwebtoken"

export interface AccessTokenPayload {
    sub: string;
    aud: string;
    iss: string;
}
export interface RefreshTokenPayload {
    sub: string;
    aud: string;
    iss: string;
    jti: string;
}
export interface IdTokenPayload {
    sub: string;
    name: string;
    email: string;
    aud: string;
    iss: string;
}

export class Jwt {
    static privateKey: string = process.env.PRIVATE_KEY;
    static publicKey: crypto.KeyObject = crypto.createPublicKey(this.privateKey);

    static signAccessToken(payload: AccessTokenPayload, expiresIn: SignOptions['expiresIn']): string {
        return jwt.sign(payload, this.privateKey, { algorithm: 'RS256', expiresIn })
    }
    static verifyAccessToken(token: string): jwt.JwtPayload | string {
        return jwt.verify(token, this.publicKey, { algorithms: ["RS256"] })
    }
    static signRefreshToken(payload: RefreshTokenPayload, expiresIn: SignOptions['expiresIn']): string {
        return jwt.sign(payload, this.privateKey, { algorithm: 'RS256', expiresIn })
    }
    static verifyRefreshToken(token: string): jwt.JwtPayload | string {
        return jwt.verify(token, this.publicKey, { algorithms: ["RS256"] })
    }
    static signIdToken(payload: IdTokenPayload, expiresIn: SignOptions['expiresIn']): string {
        return jwt.sign(payload, this.privateKey, { algorithm: 'RS256', expiresIn })
    }
    static verifyIdToken(token: string): jwt.JwtPayload | string {
        return jwt.verify(token, this.publicKey, { algorithms: ["RS256"] })
    }
}