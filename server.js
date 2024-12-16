import "dotenv/config";
import express from "express";
import session from "express-session";
import https from "https";
import passport from "passport";
import { config } from "./config/config.js";
import apiMessageRoutes from "./routes/apiMessageRoutes.js";
import apiProfileRoutes from "./routes/apiProfileRoutes.js";
import {passportService} from "./services/passportService.js";
import apiOptionRoutes from "./routes/apiOptionRoutes.js";
import './util/dbUtil.js';
import logger from "./services/loggingService.js";
import apiChatRoutes from "./routes/apiChatRoutes.js";
import cors from "cors";

const app = express();
app.use(cors());

// Configure express-session
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passportService);
app.use(passport.session());
app.use(express.json());
app.use("/", apiMessageRoutes);
app.use("/", apiProfileRoutes);
app.use("/", apiOptionRoutes);
app.use("/", apiChatRoutes);

https.createServer(config.sslOptions, app).listen(config.httpsPort, () => {
  logger.info(`Secure server running at https://localhost:${config.httpsPort}`);
});
