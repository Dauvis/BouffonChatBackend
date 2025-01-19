import "dotenv/config";
import express from "express";
import https from "https";
import config from "./config/config.js";
import './util/dbUtil.js';
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import "./services/purgeService.js";

import logger from "./services/loggingService.js";

import apiMessageRoutes from "./routes/apiMessageRoutes.js";
import apiProfileRoutes from "./routes/apiProfileRoutes.js";
import apiOptionRoutes from "./routes/apiOptionRoutes.js";
import apiChatRoutes from "./routes/apiChatRoutes.js";
import apiLoginRoutes from "./routes/apiLoginRoutes.js";
import apiTemplateRoutes from "./routes/apiTemplateRoutes.js";

const app = express();
app.use(cors({ origin: config.webAppSite, credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(express.json());
app.use(cookieParser());
app.use("/", apiMessageRoutes);
app.use("/", apiProfileRoutes);
app.use("/", apiOptionRoutes);
app.use("/", apiChatRoutes);
app.use("/", apiLoginRoutes);
app.use("/", apiTemplateRoutes);

https.createServer(config.sslOptions, app).listen(config.httpsPort, () => {
  logger.info(`Secure server running on port ${config.httpsPort}`);
});
