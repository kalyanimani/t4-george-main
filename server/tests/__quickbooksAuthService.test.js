// NOTE: discard this file. This is only meant for Getting started.
require("dotenv").load(); // No need of this line in actual project files as it is already present in server.js

const quickbooksAuthService = require("../auth/QuickbooksAuthService");

//tokensdata or refreshedTokensData can be null or an object containing tokens information
//if null then there is an error in the auth micro service.

async function exampleAsyncFunction() {
  const tokensData = await quickbooksAuthService.getTokensData();
  const refreshedTokensData = await quickbooksAuthService.refreshNewTokens();

  console.log(tokensData);
  console.log(refreshedTokensData);
}
exampleAsyncFunction();

/* or
function promiseBasedFunction() {
  quickbooksAuthService.then((tokensData) => {
    //token data can be null or an object containing tokens information
    //if null then there is an error in the auth micro service.
  });
  promiseBasedFunction()
}
*/
