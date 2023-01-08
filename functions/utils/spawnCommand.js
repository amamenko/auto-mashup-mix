const { spawn } = require("child_process");
const { logger } = require("../../logger/logger");
require("dotenv").config();

module.exports = (cmd, args, onError, onFinish) => {
  const formattedArgs = args
    .split(" ")
    .map((item) => item.trim())
    .filter((item) => item);

  const proc = spawn(cmd, formattedArgs, { stdio: "ignore" });

  proc.on("error", (err) => {
    if (process.env.NODE_ENV === "production") {
      logger("server").error(`Received child process spawn error: ${err}`);
    } else {
      console.error(`Child process spawn error: ${err}`);
    }
    onError;
  });

  proc.on("close", onFinish);
};
