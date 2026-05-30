import pool from "../model/db.js"
import ApiError from "../../common/ApiError.js"
import { v4 as uuidv4 } from "uuid"
const authorizeService = async (req, res) => {
    const { client_id, redirect_uri, response_type, scope, state } = req.query
    const client = await pool.query("select * from clients where client_id=$1", [client_id])
    if (client.rows.length == 0) {
        throw ApiError.notFound("Client not found")
    }
    if (client.rows[0].redirect_uri != redirect_uri) {
        throw ApiError.badRequest("Invalid redirect URI")
    }
    if (response_type !== 'code') {
        throw ApiError.badRequest("Invalid response type. Only 'code' is supported.");
    }

    if (!req.session.userId) {
        req.session.returnTo = req.originalUrl
       return res.send(renderLoginPage(client.rows[0].app_name, client_id, redirect_uri, response_type, scope, state))
    }
    const userId = req.session.userId
    console.log("User logged in:", userId)
    const code = uuidv4();
    const expires_at = new Date(Date.now() + 2 * 60 * 1000); 
    await pool.query(
        "INSERT INTO autorization_codes (code, user_id, client_id, expires_at, is_used) VALUES ($1, $2, $3, $4, $5)", 
        [code, userId, client.rows[0].id, expires_at, false]
    )
    const finalUrl = `${redirect_uri}?code=${code}&state=${state}`
    res.redirect(finalUrl)

}

const renderLoginPage = (appName, clientId, redirectUri, responseType, scope, state, error = null) => {
    const actionUrl = `/api/oidc/login-submit?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${scope}${state ? `&state=${state}` : ''}`;
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Login - YourOIDC</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f1f5f9; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
            .container { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
            .logo { font-size: 26px; font-weight: 700; background: linear-gradient(to right, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 24px; }
            .app-badge { background: rgba(99, 102, 241, 0.15); color: #818cf8; padding: 6px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; text-align: center; margin-bottom: 24px; border: 1px solid rgba(99, 102, 241, 0.2); }
            .form-group { margin-bottom: 20px; }
            label { display: block; font-size: 13px; font-weight: 600; color: #cbd5e1; margin-bottom: 8px; }
            input { width: 100%; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 12px 16px; font-size: 15px; color: #f8fafc; outline: none; box-sizing: border-box; }
            button { width: 100%; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border: none; border-radius: 12px; padding: 14px; color: white; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 10px; }
            .error { color: #f87171; font-size: 13px; margin-bottom: 15px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">YourOIDC</div>
            <div class="app-badge">Login to continue to <b>\${appName}</b></div>
            \${error ? \`<div class="error">\${error}</div>\` : ''}
            <form action="\${actionUrl}" method="POST">
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" required placeholder="you@example.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="password" required placeholder="••••••••">
                </div>
                <button type="submit">Authorize & Login</button>
            </form>
        </div>
    </body>
    </html>
    `;
}
