import pool from '../model/db.js';
import bcrypt from 'bcrypt';
import { validateAuthorizeParams, createAuthorizationCode } from '../service/oidc.service.js';

// Helper to render the premium HTML login page
const renderLoginPage = (appName, clientId, redirectUri, responseType, scope, error = null, email = '') => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - YourOIDC</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Plus Jakarta Sans', sans-serif;
            }
            body {
                background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                color: #f1f5f9;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: rgba(30, 41, 59, 0.7);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
                width: 100%;
                max-width: 440px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .header {
                text-align: center;
                margin-bottom: 32px;
            }
            .logo {
                font-size: 28px;
                font-weight: 700;
                background: linear-gradient(to right, #6366f1, #a855f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
            }
            .subtitle {
                font-size: 14px;
                color: #94a3b8;
            }
            .app-badge {
                background: rgba(99, 102, 241, 0.15);
                color: #818cf8;
                padding: 6px 12px;
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
                display: inline-block;
                margin-top: 12px;
                border: 1px solid rgba(99, 102, 241, 0.2);
            }
            .form-group {
                margin-bottom: 20px;
            }
            .form-label {
                display: block;
                font-size: 13px;
                font-weight: 600;
                color: #cbd5e1;
                margin-bottom: 8px;
            }
            .form-input {
                width: 100%;
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px 16px;
                font-size: 15px;
                color: #f8fafc;
                outline: none;
                transition: all 0.3s;
            }
            .form-input:focus {
                border-color: #6366f1;
                box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
                background: rgba(15, 23, 42, 0.8);
            }
            .btn-submit {
                width: 100%;
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                border: none;
                border-radius: 12px;
                padding: 14px;
                color: white;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                margin-top: 10px;
            }
            .btn-submit:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
                background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            }
            .btn-submit:active {
                transform: translateY(0);
            }
            .error-banner {
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.25);
                color: #f87171;
                padding: 12px;
                border-radius: 12px;
                font-size: 13px;
                margin-bottom: 24px;
                text-align: center;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">YourOIDC</div>
                <div class="subtitle">Log in to continue to</div>
                <div class="app-badge">${appName}</div>
            </div>
            
            ${error ? `<div class="error-banner">${error}</div>` : ''}

            <form action="/api/oidc/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${scope}" method="POST">
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input class="form-input" type="email" name="email" placeholder="you@example.com" required value="${email}">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input class="form-input" type="password" name="password" placeholder="••••••••" required>
                </div>
                <button class="btn-submit" type="submit">Sign In & Authorize</button>
            </form>
        </div>
    </body>
    </html>
    `;
};

// GET /authorize - Validates params and shows the login page
const showLoginPage = async (req, res) => {
    try {
        const { client_id, redirect_uri, response_type, scope } = req.query;
        
        // Validate params first
        const client = await validateAuthorizeParams(client_id, redirect_uri, response_type);

        // Render HTML Login Page
        return res.send(renderLoginPage(client.app_name, client_id, redirect_uri, response_type, scope));
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

// POST /authorize - Handles the credentials, generates the auth code and redirects
const handleLoginSubmit = async (req, res) => {
    const { client_id, redirect_uri, response_type, scope } = req.query;
    const { email, password } = req.body;

    let client;
    try {
        // Validate client parameters again to ensure no tampered requests
        client = await validateAuthorizeParams(client_id, redirect_uri, response_type);
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message || "Invalid authorize params"
        });
    }

    try {
        // Find user by email
        const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userRes.rows.length === 0) {
            return res.send(renderLoginPage(client.app_name, client_id, redirect_uri, response_type, scope, "Invalid email or password", email));
        }

        const user = userRes.rows[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.send(renderLoginPage(client.app_name, client_id, redirect_uri, response_type, scope, "Invalid email or password", email));
        }

        // Generate authorization code and store it in DB (associated with user.id and client.id)
        const code = await createAuthorizationCode(client.id, user.id);

        // Redirect to the client's redirect_uri with the code parameter
        const redirectUrl = `${redirect_uri}?code=${code}`;
        return res.redirect(redirectUrl);

    } catch (error) {
        console.error("Authorization error:", error);
        return res.status(500).send("Internal Server Error");
    }
};

export {
    showLoginPage,
    handleLoginSubmit
};
