import mongoose from 'mongoose';
import config from "../config/config.js";
import logger from "../services/loggingService.js";

mongoose.connect(config.mongoDBUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => logger.info('MongoDB connection established'))
.catch((error) => logger.error(`MongoDB connection error: ${error}`));

//mongoose.set('debug', true)

export default mongoose;
