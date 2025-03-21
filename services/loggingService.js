import bunyan from "bunyan";
import config from "../config/config.js";

var logger = bunyan.createLogger({
    name: 'bouffonchat',
    streams: [
        {
            level: config.consoleLogLevel,
            stream: process.stdout
        },
    ]
});

export default logger;
