import "dotenv/config";
import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
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

if (config.useHTTPS === "true") {
    const sslOptions = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    };

    https.createServer(sslOptions, app).listen(config.port, () => {
        logger.info(`Secure server running on port ${config.port}`);
    });
} else {
    http.createServer(app).listen(config.port, () => {
        logger.info(`Server running on port ${config.port}`);
    })
}
