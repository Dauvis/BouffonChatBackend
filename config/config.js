import { __dirname } from "../util/envUtil.js";

const config = {
  port: process.env.PORT,
  useHTTPS: process.env.USE_HTTPS,
  jwtSecret: process.env.JWT_SECRET,
  refreshSecret: process.env.REFRESH_SECRET,
  sessionSecret: process.env.SESSION_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  openAIKey: process.env.OPENAI_API_KEY,
  mongoDBUri: process.env.MONGODB_URI,
  logLevel: process.env.LOG_LEVEL,
  accessTokenLife: process.env.ACCESS_LIFE,
  refreshTokenLife: process.env.REFRESH_LIFE,
  cookieLife: process.env.COOKIE_LIFE,
  cookieSecret: process.env.COOKIE_SECRET,
  idleChatLife: process.env.IDLE_CHAT_LIFE,
  purgeFrequency: process.env.PURGE_FREQUENCY,
  webAppSite: process.env.WEB_APP_SITE,
  __dirname
};

export default config;