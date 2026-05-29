import express from "express";
import authRouter from "./routes/auth.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
    res.json({ message: "OIDC Provider Server is running" });
});

app.use((err, req, res, next) => {
    console.error("App Error:", err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: err.error || []
    });
});

export default app;
