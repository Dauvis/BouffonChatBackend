import cron from "node-cron";
import config from "../config/config.js";
import chatService from "./chatService.js";

cron.schedule(`*/${config.purgeFrequency} * * * *`, async () => {
    await chatService.performIdleChatPurge();
});

