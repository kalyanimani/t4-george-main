const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create Schema
const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discountPrice: {
        type: Number,
        required: true
    },
    stockCount: {
        type: Number,
        required: true
    },
    images: {
        type: [String]
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'categories'
    },
    subcategory: {
        type: Schema.Types.ObjectId,
        ref: 'subcategories'
    },
    subcategoryChild: {
        type: Schema.Types.ObjectId,
        ref: 'subcategorychilds'
    },
    quickship: {
        type: Boolean,
        default: false
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    keywords: {
        type: [String],
    },
    metadata: {
        attributeOptions: Object
    },
    productVariants: [{ type: Schema.Types.ObjectId, ref: "productvariants" }],
}, { timestamps: true });
ProductSchema.index({ keywords: 1 });
module.exports = ProductV2 = mongoose.model('productsv2', ProductSchema);
