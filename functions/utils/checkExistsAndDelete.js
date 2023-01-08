const fs = require("fs");
const { checkFileExists } = require("./checkFileExists");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const checkExistsAndDelete = async (filename) => {
  const fileExists = await checkFileExists(filename);

  if (fileExists) {
    fs.rm(
      filename,
      {
        recursive: true,
        force: true,
      },
      () => {
        const deletedStatement = `${filename} file deleted!`;

        if (process.env.NODE_ENV === "production") {
          logger("server").info(deletedStatement);
        } else {
          console.log(deletedStatement);
        }
      }
    );
  }
};

module.exports = { checkExistsAndDelete };
