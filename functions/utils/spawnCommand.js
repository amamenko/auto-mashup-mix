const { spawn } = require("child_process");
const { logger } = require("../logger/initializeLogger");
require("dotenv").config();

module.exports = (cmd, args, onError, onFinish) => {
  const formattedArgs = args
    .split(" ")
    .map((item) => item.trim())
    .filter((item) => item);

  const proc = spawn(cmd, formattedArgs, { stdio: "ignore" });

  proc.on("error", (err) => {
    if (process.env.NODE_ENV === "production") {
      logger.error("Received child process spawn error", {
        indexMeta: true,
        meta: {
          message: err,
        },
      });
    } else {
      console.error(`Child process spawn error: ${err}`);
    }
    onError;
  });

  proc.on("close", onFinish);
};
