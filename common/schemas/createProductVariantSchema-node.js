const yup = require("yup")

const createProductVariantSchema = yup
    .object({
        sku: yup.string().required("SKU is required"),
        totalAdditionalCost: yup.number().required("Additional cost is required"),
        attributes: yup.object().required("attributes is required"),
    }).required();

module.exports = createProductVariantSchema