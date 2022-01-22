
require("dotenv").load();
const QuickBooksService = require("../services/QuickBooksService");

async function exampleAsyncFunction() {
    const quickBookService = new QuickBooksService()
    await quickBookService.init()
    try {
        const user = await quickBookService.createUser({
            "Title": "Mr",
            "GivenName": "George2",
            "MiddleName": "Mickael",
            "FamilyName": "Antony",
            "PrimaryEmailAddr": {
                "Address": "gmarocker+dev2@gmail.com"
            },
        })
        console.log(user)
    } catch (e) {
        console.log(e.response.status)
        console.log(e.response.data.Fault.Error)
    }
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
