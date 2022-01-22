var AWS = require("aws-sdk");

var lambda = new AWS.Lambda({
  accessKeyId: process.env?.AWS_ACCESS_KEY.trim(),
  secretAccessKey: process.env?.AWS_SECRET_KEY.trim(),
  region: process.env?.AWS_DEFAULT_REGION.trim(),
});

const getTokensLambdaName = process.env.AWS_LAMDA_GET_TOKENS;
const renewTokensLambdaName = process.env.AWS_LAMBDA_RENEW_TOKENS;

class QuickbooksAuthService {
  constructor() { }

  async getTokensData() {
    try {
      const data = await lambda
        .invoke({
          FunctionName: getTokensLambdaName,
        })
        .promise();
      const body = JSON.parse(data.Payload).body
      return JSON.parse(body).data
    } catch (e) {
      console.error("Error while fetching the access token");
      console.error(e);
      return null;
    }
  }

  async refreshNewTokens() {
    try {
      const data = await lambda
        .invoke({
          FunctionName: renewTokensLambdaName,
        })
        .promise();
      const body = JSON.parse(data.Payload).body
      return JSON.parse(body).data
    } catch (e) {
      console.error("Error while refreshing the tokens;");
      console.error(e);
      return null;
    }
  }
}

module.exports = new QuickbooksAuthService();
