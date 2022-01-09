const { once } = require("events");
const { logger } = require("./initializeLogger");
require("dotenv").config();

const onLoggerShutdown = () => {
  if (process.env.NODE_ENV === "production") {
    logger.on("error", console.error);

    const shutdown = async () => {
      await once(logger, "cleared");
    };

    const onSignal = (signal) => {
      logger.warn("Received signal, shutting down", {
        indexMeta: true,
        meta: {
          signal,
        },
      });
      shutdown();
    };

    process.on("SIGTERM", onSignal);
    process.on("SIGINT", onSignal);
  }
};

module.exports = { onLoggerShutdown };
