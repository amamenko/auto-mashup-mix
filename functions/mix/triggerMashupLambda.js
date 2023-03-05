const { InvokeCommand } = require("@aws-sdk/client-lambda");
const { logger } = require("../../logger/logger");
require("dotenv").config();

const triggerMashupLambda = async (client) => {
  const params = {
    FunctionName: process.env.AWS_LAMBDA_MASHUP_FUNCTION_NAME,
    InvocationType: "RequestResponse",
    Payload: Buffer.from(JSON.stringify({})),
  };
  try {
    const command = new InvokeCommand(params);
    const invocationStatement = `AWS Lambda function ${process.env.AWS_LAMBDA_MASHUP_FUNCTION_NAME} invoked.`;
    if (process.env.NODE_ENV === "production") {
      logger("server").info(invocationStatement);
    } else {
      console.log(invocationStatement);
    }
    return await client
      .send(command)
      .then((data) => {
        const payloadDecoded = JSON.parse(Buffer.from(data.Payload));
        process.env.NODE_ENV === "production"
          ? logger("server").info(payloadDecoded)
          : console.log(payloadDecoded);
      })
      .catch((err) => {
        process.env.NODE_ENV === "production"
          ? logger("server").error(err)
          : console.error(err);
      });
  } catch (err) {
    process.env.NODE_ENV === "production"
      ? logger("server").error(err)
      : console.error(err);
  }
};

module.exports = { triggerMashupLambda };
