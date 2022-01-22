const QuickBooksBase = require('./QuickBooksBase');

const QUICKBOOKS_REALM_ID = process.env.QUICKBOOKS_REALM_ID
const QUICKBOOKS_API_BASE_URL = process.env.QUICKBOOKS_API_BASE_URL
const QUICKBOOKS_API_VERSION = "v3"

class QuickBooksService extends QuickBooksBase {
    constructor() {
        super()
    }

    async init() {
        await super.init()
    }

    async createUser(userData) {
        const url = `${QUICKBOOKS_API_BASE_URL}/${QUICKBOOKS_API_VERSION}/company/${QUICKBOOKS_REALM_ID}/customer?minorversion=62`
        try {
            const res = await this.callApi(url, userData, QuickBooksBase.POST)
            return res.data
        } catch (error) {
            console.log("Error while creating user ", userData)
            throw error
        }
    }

    async createSalesOrder(salesOrderData) {
        const url = `${QUICKBOOKS_API_BASE_URL}/${QUICKBOOKS_API_VERSION}/company/${QUICKBOOKS_REALM_ID}/salesreceipt?minorversion=40`
        try {
            const res = await this.callApi(url, salesOrderData, QuickBooksBase.POST)
            return res.data
        } catch (error) {
            console.log("Error while making the order ", salesOrderData)
            throw error
        }
    }

    async syncProducts(unsyncedProducts) {
        const url = `${QUICKBOOKS_API_BASE_URL}/${QUICKBOOKS_API_VERSION}/company/${QUICKBOOKS_REALM_ID}/batch?minorversion=62`
        const quicbooksItemBatchCreatePayload = {
            "BatchItemRequest": unsyncedProducts.map(variant => {
                return {
                    "Item": {
                        "Sku": variant.sku,
                        "Type": "NonInventory",
                        "Name": variant.sku,
                        "UnitPrice": variant.totalAdditionalCost,
                        "AssetAccountRef": {
                            "name": "George-Inventory Asset",
                            "value": "81"
                        },
                        "ExpenseAccountRef": {
                            "name": "George-Cost of Goods Sold",
                            "value": "80"
                        }
                    },
                    "operation": "create"
                }
            })
        }
        console.log("quicbooksItemBatchCreatePayload", quicbooksItemBatchCreatePayload)
        const res = await this.callApi(url, quicbooksItemBatchCreatePayload, QuickBooksBase.POST)
        return res
    }
}

module.exports = QuickBooksService