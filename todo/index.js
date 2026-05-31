import "dotenv/config";
import express from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4001";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for React Frontend with credentials (cookies) support
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "todosupersecretsession",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 60 * 60 * 1000, // 1 hour session
      secure: false, // Set to true if using HTTPS in production
      httpOnly: true 
    },
  })
);

// In-Memory Todo Store
// Struct: { id: string, userId: string, task: string, completed: boolean }
const todosDb = [];

// Middleware to protect API routes
const requireAuth = (req, res, next) => {
  if (!req.session.userProfile) {
    return res.status(401).json({ success: false, message: "Unauthorized: Please log in." });
  }
  next();
};

// ==========================================
// [OIDC INTEGRATION STEP 1] - AUTHORIZATION REQUEST
// Redirect user's browser to the OIDC Provider's authorize endpoint.
// ==========================================
app.get("/api/auth/login", (req, res) => {
  const providerUrl = process.env.OIDC_PROVIDER_URL || "http://localhost:3000";
  const authUrl =
    `${providerUrl}/api/oidc/authorize?` +
    `client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=openid+profile+email` +
    `&state=todosessionstate999`;

  console.log("Redirecting user to OIDC Provider:", authUrl);
  res.redirect(authUrl);
});

// ==========================================
// [OIDC INTEGRATION STEP 2 & 3] - CALLBACK HANDLER & TOKEN EXCHANGE
// ==========================================
app.get("/api/auth/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`${FRONTEND_URL}/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description)}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/?error=missing_code`);
  }

  try {
    const providerUrl = process.env.OIDC_PROVIDER_URL || "http://localhost:3000";

    console.log("1. Exchanging authorization code for tokens...");
    // [OIDC INTEGRATION STEP 2] - BACK-CHANNEL TOKEN EXCHANGE
    const tokenResponse = await fetch(`${providerUrl}/api/oidc/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || tokens.error || "Token exchange failed");
    }

    console.log("2. Fetching UserInfo from OIDC Provider using Access Token...");
    // [OIDC INTEGRATION STEP 3] - FETCH USER PROFILE CLAIMS
    const userinfoResponse = await fetch(`${providerUrl}/api/oidc/userinfo`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const profile = await userinfoResponse.json();
    if (!userinfoResponse.ok) {
      throw new Error(profile.error_description || "UserInfo extraction failed");
    }

    // [OIDC INTEGRATION STEP 4] - LOCAL SESSION CREATION
    req.session.userProfile = profile;
    req.session.userId = profile.sub; // unique subject identifier (OIDC sub claim)

    console.log("Authentication successful! Session created for user:", profile.email);
    // Redirect browser back to React frontend dashboard
    res.redirect(`${FRONTEND_URL}`);
  } catch (err) {
    console.error("Authentication Callback Failed:", err);
    res.redirect(`${FRONTEND_URL}/?error=auth_failed&message=${encodeURIComponent(err.message)}`);
  }
});

// Get current user profile details
app.get("/api/auth/me", (req, res) => {
  if (req.session.userProfile) {
    return res.json({ success: true, user: req.session.userProfile });
  }
  res.status(401).json({ success: false, message: "Unauthenticated" });
});

// Log out user session
app.post("/api/auth/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.status(500).json({ success: false, message: "Could not log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// ==========================================
// [OIDC INTEGRATION STEP 5] - USER IDENTIFICATION BY 'sub' CLAIM
// ==========================================
// Get all Todos for the current logged-in user
app.get("/api/todos", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const userTodos = todosDb.filter((todo) => todo.userId === userId);
  res.json({ success: true, todos: userTodos });
});

// Add a Todo task
app.post("/api/todos", requireAuth, (req, res) => {
  const { task } = req.body;
  if (!task || !task.trim()) {
    return res.status(400).json({ success: false, message: "Task cannot be empty" });
  }

  const newTodo = {
    id: Date.now().toString(),
    userId: req.session.userId, // bound to OIDC sub claim
    task: task.trim(),
    completed: false,
  };
  todosDb.push(newTodo);

  res.status(201).json({ success: true, todo: newTodo });
});

// Delete a Todo task
app.delete("/api/todos/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  const index = todosDb.findIndex((todo) => todo.id === id && todo.userId === userId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Todo item not found" });
  }

  todosDb.splice(index, 1);
  res.json({ success: true, message: "Task deleted successfully" });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/dist")));
  
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Todo API Backend is running at http://localhost:${PORT}`);
});
