import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import httpStatus from "http-status";
import cookieParser from "cookie-parser";
import config from "./config";
import { Routers } from "./router";
import globalErrorHandler from "./app/middleware/global.error.handler";

const app: Application = express();
app.set("trust proxy", 1); // Trust first proxy to securely read req.ip
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later."
});

app.use(limiter);



const defaultCorsOrigins = [
  "http://localhost:4001",
  "http://localhost:4002",
  "https://storysparkai-five.vercel.app",
];

const corsOrigins =
  config.cors_origins && config.cors_origins.length > 0
    ? config.cors_origins
    : defaultCorsOrigins;

// ── FIXED CORS MIDDLEWARE ENGINE (WITH CORRECTED SYNTAX BRACKETS) ──
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by Cross-Origin Resource Sharing (CORS) Policy"));
      } // <-- Safely closed the else statement block here
    },  // <-- Safely closed the origin function assignment here
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Cookie"], 
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Keeps your extended payload parsing enabled
app.use(cookieParser() as any);


// Routes
app.use("/api/v1", Routers);

// Global 404 Fallback Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "Not Found",
    errorMessage: [
      {
        path: req.originalUrl,
        message: "API Not Found",
      },
    ],
  });
});

app.use(globalErrorHandler);

export default app;
