const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create Schema

const SubCategorySchema = new Schema({
    adminID: {
        type: Schema.Types.ObjectId,
        ref: "admins",
    },
    // adminID:{
    //     type: Schema.Types.ObjectId,
    //     ref : 'admins'
    // },
    categoryID: {
        type: Schema.Types.ObjectId,
        ref: "categories",
    },
    subCategoryName: {
        type: String,
        required: true,
    },
    isEnabled: {
        type: String,
        enum: ["Yes", "No"],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    subCategoryChildren: [
        { type: Schema.Types.ObjectId, ref: "subcategorychilds" },
    ],
});

module.exports = SubCategory = mongoose.model(
    "subcategories",
    SubCategorySchema
);
