import fs from "fs";
import { __dirname } from "../util/envUtil.js";

export const config = {
  httpsPort: process.env.HTTPS_PORT,
  jwtSecret: process.env.JWT_SECRET,
  sessionSecret: process.env.SESSION_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  openAIKey: process.env.OPENAI_API_KEY,
  sslOptions: {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  },
  gptModel: "gpt-4o-mini",
  mongoDBUri: process.env.MONGODB_URI,
  fileLogLevel: process.env.FILE_LOG_LEVEL,
  consoleLogLevel: process.env.CONS_LOG_LEVEL,
  fileLogPath: process.env.FILE_LOG_PATH,
  __dirname
};