const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

//Load input Validation
const validateProductInput = require('../../validation/Product/ProductValidation');

//Load Product Model
const Product = require('../../models/Product');
const ProductV2 = require('../../models/ProductV2')
const ProductVariant = require('../../models/ProductVariant')
const SubCategory = require('../../models/SubCategory');
const Slider = require('../../models/Slider');
const AttributeMapping = require('../../models/AttributeMapping');
const AttributeCategory = require('../../models/AttributeCategory')
const QuickBookIntegration = require('../../models/QuickBookIntegration')
const QuickBooksService = require('../../services/QuickBooksService')

const validate = require('../../middleware/validate')
const createProductRequestSchema = require("../../../common/schemas/createProductRequestSchema-node")
const errorResponse = require("../../utils/errorResponse")
const errorMessages = require("../../constants/errorMessages")

const saveProductVariantsInQuickbooks = async (productVariantSkus) => {
    console.log(productVariantSkus)
    const unsyncedProdcutVariants = await ProductVariant.find({ quickBooksSynced: false, sku: { $in: productVariantSkus } })
    const quickbooksService = new QuickBooksService()
    await quickbooksService.init()
    try {
        const result = await quickbooksService.syncProducts(unsyncedProdcutVariants)
        return result
    } catch (e) {
        throw e
    }
}



router.post('/syncquickbooks',
    //passport.authenticate('jwt', { session: false }),
    //validate(createProductRequestSchema),
    async (req, res) => {
        try {
            const variants = await ProductVariant.find({ quickBooksSynced: false, sku: { $ne: null } }).limit(1)
            console.log("Variants", variants)
            const varitantSKUs = variants.map(variant => variant.sku)
            console.log("varitantSKUs", varitantSKUs)
            const result = await saveProductVariantsInQuickbooks(varitantSKUs);

            if (result.data.BatchItemResponse) {
                for (let response of result.data.BatchItemResponse) {
                    if (response.Fault) {
                        console.log(response.Fault.Error)
                    } else if (response.Item) {
                        await ProductVariant.findOneAndUpdate({ sku: response.Item.Sku }, { quickBooksSynced: true })
                    }
                }
            }
        } catch (e) {
            console.log(e)
        }
    }
)

const createProduct = async (productData, session) => {
    const {
        attributeOptions, productVariants, ...productFieldsObject
    } = productData
    productFieldsObject.metadata = { attributeOptions }
    const newProduct = new ProductV2(productFieldsObject)
    await newProduct.save({ session })
    return newProduct
}

const createProductVariants = async (productVariantsData, parentProduct, session) => {
    const productVariantsObjects = productVariantsData.map((variant) => {
        return { ...variant, product: parentProduct, quickBooksSynced: false, quickBooksItemId: null }
    })
    console.log("parentProduct", parentProduct)
    const productVariants = await ProductVariant.create(productVariantsObjects, { session })
    if (!parentProduct.productVariants) parentProduct.productVariants = []
    const updatedVariantsInParent = parentProduct.productVariants.concat(productVariants.map(variant => variant._id))
    console.log("updatedVariantsInParent", updatedVariantsInParent)
    parentProduct.productVariants = updatedVariantsInParent
    await parentProduct.save({ session })
}

const createNewAttributeCategoriesSilently = async (attributeOptions) => {
    try {
        const attributeCategoryNames = Object.keys(attributeOptions)
        await AttributeCategory.bulkWrite(attributeCategoryNames.map(attributeName => ({
            updateOne: {
                filter: { attributeName },
                update: { attributeName, isEnabled: true },
                upsert: true
            }
        })))
    } catch (error) {
        console.log(error)
    }
}

router.post('/',
    //passport.authenticate('jwt', { session: false }),
    //validate(createProductRequestSchema),
    async (req, res) => {
        const { name: productName, productVariants, attributeOptions } = req.body
        const isProductExising = !! await ProductV2.findOne({ name: productName })
        if (isProductExising) {
            const errorMessage = errorMessages.PRODUCT_WITH_NAME_ALREADY_PRESENT?.replace("%s", productName)
            return res.status(400).json(errorResponse(errorMessage))
        }
        const session = await mongoose.startSession();
        session.startTransaction()
        let newProduct;
        try {
            newProduct = await createProduct(req.body, session)
        } catch (error) {
            console.error(error)
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json(errorResponse())
        }
        try {
            await createProductVariants(productVariants, newProduct, session)
        } catch (error) {
            console.error(error)
            await session.abortTransaction();
            session.endSession();
            if (error?.code === 11000) { //Duplicate key error
                const errorMessage = errorMessages.PRODUCT_VARIANT_SKU_ALREADY_PRESENT?.replace("%s", error.keyValue?.sku)
                return res.status(400).json(errorResponse(errorMessage))
            } else {
                return res.status(500).json(errorResponse())
            }
        }
        await session.commitTransaction();
        session.endSession();
        await createNewAttributeCategoriesSilently(attributeOptions)
        return res.json({ data: newProduct })
    }
);

// @route GET  api/product/test
// @desc  Test Product route
// @access public
router.get('/test', async (req, res) => {
    AttributeMapping.aggregate([
        { $match: { productID: mongoose.Types.ObjectId("60be395a52dc3318440512b4") } },
        { $sort: { date: -1 } },
        {

            $lookup: {
                from: "parentattributecategories",
                foreignField: "_id",
                localField: "parentAttributeCategoryID",
                as: "parentatribute"
            }
        },
        {
            "$unwind": "$parentatribute"
        },
        {

            $lookup: {
                from: "attributecategories",
                foreignField: "_id",
                localField: "attributeCategoryID",
                as: "attribute"
            }
        },
        {
            "$unwind": "$attribute"
        },
        {
            $addFields: { attributeName: "$attribute.attributeName" }
        },
        {
            "$group": {
                "_id": "$parentAttributeCategoryID",
                "parentAttributeName": { $first: "$parentatribute.attributeName" },
                "date": { $first: "$parentatribute.date" },
                "attributes": { "$push": '$$ROOT' },
            },
        },
        {
            "$group": {
                "_id": "",
                "data": { "$push": "$$ROOT" },

            }
        },
        { $sort: { _id: 1 } },
    ]).then(product => {

        if (product.length > 0) {
            res.json(product[0].data);
        } else {
            res.json([]);
        }

    });
});

router.post('/web/getshop', async (req, res) => {
    //GET Category
    var CategoryView = await SubCategory.aggregate([
        { $match: { categoryID: mongoose.Types.ObjectId(req.body.categoryID) } },
        {

            $lookup: {
                from: "products",
                foreignField: "subcategoryID",
                localField: "_id",
                as: "products"
            }
        },
    ]);
    var OtherCategoryView = await SubCategory.aggregate([

        { $match: { categoryID: { '$nin': [mongoose.Types.ObjectId(req.body.categoryID)] } } },
        {

            $lookup: {
                from: "products",
                foreignField: "subcategoryID",
                localField: "_id",
                as: "products"
            },

        },

    ]);
    var SliderView = await Slider.aggregate([
        { $match: { categoryID: mongoose.Types.ObjectId(req.body.categoryID) } },
        {

            $lookup: {
                from: "products",
                foreignField: "_id",
                localField: "productID",
                as: "product"
            }
        },
        {
            "$unwind": {
                path: "$product",
                preserveNullAndEmptyArrays: true
            }
        },
    ]);
    res.json({ category: CategoryView, slider: SliderView, other: OtherCategoryView })
});

router.post('/web', (req, res) => {

    var q = {}; // declare the query object
    q['$and'] = [{ isEnabled: 'Yes' }]; // filter the search by any criteria given by the user
    if (req.body.categoryID) { // if the criteria has a value or 
        q["$and"].push({ categoryID: mongoose.Types.ObjectId(req.body.categoryID) }); // add to the query object
    }
    if (req.body.search) { // if the criteria has a value or 
        q["$and"].push({ $text: { $search: req.body.search } }); // add to the query object
    }
    if (req.body.subcategoryID) { // if the criteria has a value or 
        q["$and"].push({ subcategoryID: mongoose.Types.ObjectId(req.body.subcategoryID) }); // add to the query object
    }
    if (req.body.subcategoryChildID) { // if the criteria has a value or           
        q["$and"].push({ subcategoryChildID: mongoose.Types.ObjectId(req.body.subcategoryChildID) }); // add to the query object
    }

    if (req.body.quickship) { // if the criteria has a value or           
        q["$and"].push({ quickship: "Yes" }); // add to the query object
    }

    Product.aggregate([
        { $match: q },
        {

            $lookup: {
                from: "categories",
                foreignField: "_id",
                localField: "categoryID",
                as: "category"
            }
        },
        {
            "$unwind": {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "subcategories",
                foreignField: "_id",
                localField: "subcategoryID",
                as: "subCategory"
            }
        },
        {
            "$unwind": {
                path: "$subCategory",
                preserveNullAndEmptyArrays: true
            }
        },
        { $sort: { date: -1 } },
    ])
        .then(result => {
            res.json(result)
        })
        .catch(err => {
            res.status(404).json({ error: "Product Not Found" })
        });

})


router.post('/mobile/checkstock', async (req, res) => {
    var parseData = req.body.product;
    if (parseData.length > 0) {
        var productData = req.body.product;
        var resultArray = []
        productData.map((result, index) => {
            Product.findOne({ $and: [{ _id: result._id }, { isEnabled: 'Yes' }] })
                .then(queryResult => {
                    console.log(queryResult.stockCount)
                    if (parseInt(queryResult.stockCount) < parseInt(result.qty)) {
                        console.log(queryResult.stockCount, result.qty)

                        resultArray.push({ _id: queryResult._id, stock: queryResult.stockCount })
                        //     console.log("res",resultArray)

                    }
                    if (parseData.length === index + 1) {
                        res.json(resultArray)
                    }

                })
                .catch(err => res.status(404).json({ error: "Product Not Found" }));
        })


    } else {
        res.status(404).json({ error: "No Product Found In Cart" })
    }

})

router.post('/detail', (req, res) => {

    Product.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(req.body.productID) } },
        {
            $lookup: {
                from: "categories",
                foreignField: "_id",
                localField: "categoryID",
                as: "category"
            }
        },
        {
            "$unwind": {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "subcategories",
                foreignField: "_id",
                localField: "subcategoryID",
                as: "subCategory"
            }
        },
        {
            "$unwind": {
                path: "$subCategory",
                preserveNullAndEmptyArrays: true
            }
        },
        { $sort: { date: -1 } },
    ])
        .then(product => {
            if (product.length > 0) {
                res.json(product[0]);
            } else {
                res.json({});
            }

        })
        .catch(err => res.status(404).json({ error: "Product Not Found" }));
})


router.post('/attribute', async (req, res) => {
    AttributeMapping.aggregate([
        { $match: { productID: mongoose.Types.ObjectId(req.body.productID) } },
        { $sort: { date: -1 } },
        {

            $lookup: {
                from: "parentattributecategories",
                foreignField: "_id",
                localField: "parentAttributeCategoryID",
                as: "parentatribute"
            }
        },
        {
            "$unwind": "$parentatribute"
        },
        {

            $lookup: {
                from: "attributecategories",
                foreignField: "_id",
                localField: "attributeCategoryID",
                as: "attribute"
            }
        },
        {
            "$unwind": "$attribute"
        },
        {
            $addFields: { attributeName: "$attribute.attributeName" }
        },
        {
            "$group": {
                "_id": "$parentAttributeCategoryID",
                "parentAttributeName": { $first: "$parentatribute.attributeName" },
                "date": { $first: "$parentatribute.date" },
                "attributes": { "$push": '$$ROOT' },
            },
        },
        {
            "$group": {
                "_id": "",
                "data": { "$push": "$$ROOT" },

            }
        },
        { $sort: { _id: 1 } },
    ]).then(product => {

        if (product.length > 0) {
            res.json(product[0].data);
        } else {
            res.json([]);
        }

    })
        .catch(err => res.status(404).json({ error: "Product Not Found" }));

})

router.post('/maxstock', (req, res) => {
    Product.findOne({ _id: req.body.productID })
        .then(productData => {
            var variationArray = productData.variationArray ? JSON.parse(productData.variationArray) : []
            var stockCheck = variationArray.find(x => x.size === req.body.selectedSize && x.color === req.body.selectedColor);
            if (stockCheck) {
                res.json({ selectedStock: stockCheck.stock });
            }
        })

})

router.post('/suggested', (req, res) => {

    Product.find({ categoryID: { $in: req.body.categoryIDS } })
    limit(4)
        .then(productData => {
            res.json(productData);
        })
})


// @route GET  api/product/getproduct
// @desc  Test SubCategory route
// @access public
router.post('/getproduct', (req, res) => {

    Product.find({ categoryID: req.body.categoryID })
        .then(product => {
            // if(!product){
            //     errors.product = 'Product  Not Found';
            //     return res.status(404).json(errors);
            // }
            res.json(product);
        })
        .catch(err => res.status(404).json({ error: "SubCategory Not Found" }));

})

// @route GET  api/product/
// @desc  Get All product
// @access Private
router.get('/',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {

        //GET DATA BY USER TYPE
        //ADMIN TYPE
        if (req.user.userType === 'admin') {
            //Product.find()
            Product.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        foreignField: "_id",
                        localField: "categoryID",
                        as: "category"
                    }
                },
                {
                    "$unwind": {
                        path: "$category",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "subcategories",
                        foreignField: "_id",
                        localField: "subcategoryID",
                        as: "subCategory"
                    }
                },
                {
                    "$unwind": {
                        path: "$subCategory",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "subcategorychilds",
                        foreignField: "_id",
                        localField: "subcategoryChildID",
                        as: "subCategoryChild"
                    }
                },
                {
                    "$unwind": {
                        path: "$subCategoryChild",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $sort: { date: -1 } },
            ])
                .then(product => {
                    if (!product) {
                        errors.product = 'Product Name Not Found';
                        return res.status(404).json(errors);
                    }
                    res.json(product);
                })
                .catch(err => res.status(404).json({ error: "Product Not Found" }));
        }
        //STORE TYPE
        if (req.user.userType === 'store') {
            Product.aggregate([
                { $match: { storeID: mongoose.Types.ObjectId(req.user.id) } },
                {
                    $lookup: {
                        from: "stores",
                        foreignField: "_id",
                        localField: "storeID",
                        as: "store"
                    }
                },
                {
                    $unwind: "$store"
                },
                {
                    $lookup: {
                        from: "categories",
                        foreignField: "_id",
                        localField: "categoryID",
                        as: "category"
                    }
                },
                {
                    $unwind: "$category"
                },
                {
                    $lookup: {
                        from: "subcategories",
                        foreignField: "_id",
                        localField: "subcategoryID",
                        as: "subCategory"
                    }
                },
                {
                    "$unwind": {
                        path: "$subCategory",
                        preserveNullAndEmptyArrays: true
                    }
                },
                { $sort: { date: -1 } },
            ])
                .then(product => {
                    if (!product) {
                        errors.product = 'Product  Not Found';
                        return res.status(404).json(errors);
                    }
                    res.json(product);
                })
                .catch(err => res.status(404).json({ error: "Product Not Found" }));
        }
    });



// @route POST  api/product/
// @desc  Create A Draft Product
// @access Private

router.post('/draft', passport.authenticate('jwt', { session: false }), async (req, res) => {

    if (req.user.userType === 'admin') {
        const insertdata = {
            status: 'draft'
        }
        const product = new Product(insertdata)
        const createProduct = await product.save();
        res.status(201).json(createProduct);
    } else {
        res.status(201).json({ message: 'Not an admin' })
    }
})

// @route GET  api/product/delete
// @desc  Delete product by id
// @access private
router.post('/delete', passport.authenticate('jwt', { session: false }), (req, res) => {
    Product.remove({ _id: req.body.id })
        .then(product => {
            if (!product) {
                errors.product = 'Product not found to delete';
                return res.status(404).json(errors);
            }
            res.json(product);
        })
        .catch(err => res.status(404).json({ error: "Product Not Found" }));
});

// @route GET  api/product/edit
// @desc  Edit product by id
// @access private

router.post('/edit', passport.authenticate('jwt', { session: false }), (req, res) => {

    // const { errors, isValid } = validateProductInput(req.body, req.user);
    // // Check Validation
    // if (!isValid) {
    //     //if Any errors, send 400 with errors object
    //     return res.status(400).json(errors);
    // }
    //GET DATA BY USER TYPE
    //ADMIN TYPE
    if (req.user.userType === 'admin') {
        const editdata = {
            status: 'active',
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            discountPrice: req.body.discountPrice,
            stockCount: req.body.stockCount,
            photoUrl1: req.body.photoUrl1,
            photoUrl2: req.body.photoUrl2,
            documents: req.body.documents,
            maintenanceText: req.body.maintenanceText,
            maintenanceBtnText: req.body.maintenanceBtnText,
            maintenanceFileUrl: req.body.maintenanceFileUrl,
            acousticsText: req.body.acousticsText,
            categoryID: req.body.categoryID,
            subcategoryID: req.body.subcategoryID,
            subcategoryChildID: req.body.subcategoryChildID != "" ? req.body.subcategoryChildID : null,
            isEnabled: req.body.isEnabled,
            keyword: req.body.keyword,
            quickship: req.body.quickship,
            value: req.body.value

        };

        Product.findOneAndUpdate({ _id: req.body._id }, { $set: editdata }, { new: true })
            .then(product => {
                // if (!product) {
                //     errors.product = 'product not found';
                //     return res.status(404).json(errors);
                // }
                res.json(product);
            })
            .catch(err => {
                console.log("err", err)
                res.status(404).json({ error: "Product Not Found" })
            });
    }
    //STORE TYPE
    if (req.user.userType === 'store') {
        const editdata = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            discountPrice: req.body.discountPrice,
            stockCount: req.body.stockCount,
            photoUrl1: req.body.photoUrl1,
            photoUrl2: req.body.photoUrl2,
            documents: req.body.documents,
            maintenanceText: req.body.maintenanceText,
            maintenanceBtnText: req.body.maintenanceBtnText,
            maintenanceFileUrl: req.body.maintenanceFileUrl,
            acousticsText: req.body.acousticsText,
            categoryID: req.body.categoryID,
            subcategoryID: req.body.subcategoryID,
            subcategoryChildID: req.body.subcategoryChildID,
            isEnabled: req.body.isEnabled,
            keyword: req.body.keyword,
            quickship: req.body.quickship,


        };

        Product.findOneAndUpdate({ _id: req.body._id }, { $set: editdata }, { new: true })
            .then(product => {
                if (!product) {
                    errors.product = 'product not found';
                    return res.status(404).json(errors);
                }
                res.json(product);
            })
            .catch(err => res.status(404).json({ error: "Product Not Found" }));
    }


});


module.exports = router;