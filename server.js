import "dotenv/config";
import express from "express";
import https from "https";
import config from "./config/config.js";
import './util/dbUtil.js';
import cookieParser from "cookie-parser";
import cors from "cors";

import logger from "./services/loggingService.js";

import apiMessageRoutes from "./routes/apiMessageRoutes.js";
import apiProfileRoutes from "./routes/apiProfileRoutes.js";
import apiOptionRoutes from "./routes/apiOptionRoutes.js";
import apiChatRoutes from "./routes/apiChatRoutes.js";
import apiLoginRoutes from "./routes/apiLoginRoutes.js";

const app = express();
app.use(cors({ origin: 'https://localhost:8888', credentials: true }));

app.use(express.json());
app.use(cookieParser());
app.use("/", apiMessageRoutes);
app.use("/", apiProfileRoutes);
app.use("/", apiOptionRoutes);
app.use("/", apiChatRoutes);
app.use("/", apiLoginRoutes);

https.createServer(config.sslOptions, app).listen(config.httpsPort, () => {
  logger.info(`Secure server running at https://localhost:${config.httpsPort}`);
});
