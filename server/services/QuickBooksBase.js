const axios = require('axios')
const quickbooksAuthService = require("../auth/QuickbooksAuthService")
const retry = require('async-retry');


class QuickBooksBase {
    static POST = "POST"
    static GET = "GET"
    constructor() {
    }

    getHeaders() {
        return {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.tokensData?.accessToken}`
        };
    }

    async init() {
        this.tokensData = await quickbooksAuthService.getTokensData();
    }

    async callApi(url, data, type) {
        return retry(async (bail) => {
            let res;
            try {
                const headers = this.getHeaders()
                if (type === QuickBooksBase.POST) {
                    res = await axios.post(url, data, { headers })
                } else if (type === QuickBooksBase.GET) {
                    res = await axios.get(url, data, { headers })
                } else {
                    throw "Invalid request type"
                }
            } catch (error) {
                console.log("Quickbooks Call Failed.")
                if (error?.response && error?.response?.status == 401) { // 401 retry with refreshing token
                    console.log("Authentication issue. Retrying with new accesToken")
                    this.tokensData = await quickbooksAuthService.refreshNewTokens();
                    throw error
                } else {
                    bail(error) //bail from retrying
                    return;
                }
            }
            return res;
        }, {
            retries: 1,
            randomize: false,
            minTimeout: 0,
            maxTimeout: 0
        })
    }
}

module.exports = QuickBooksBase