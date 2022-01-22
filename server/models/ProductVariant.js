const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema

const ProductVariantSchema = new Schema({
    sku: {
        type: String,
        required: true,
        unique: true
    },
    totalAdditionalCost: {
        type: Number,
        required: true,
        default: 0
    },
    attributes: {
        type: Map,
        of: {
            type: {
                label: { type: String, },
                cost: { type: Number, required: true, default: 0 },
                skuPart: { type: String, required: true },
            }
        }
    },
    quickBooksItemId: {
        type: String
    },
    quickBooksSynced: {
        type: Boolean
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'productsv2'
    }
}, { timestamps: true });

module.exports = mongoose.model('productvariants', ProductVariantSchema);
