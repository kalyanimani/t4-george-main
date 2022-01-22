const yup = require("yup")
const createProductVariantSchema = require("./createProductVariantSchema-node")

const createProductRequestSchema = yup
    .object({
        name: yup.string().max(100).required("Name is required"),
        price: yup
            .number()
            .typeError("Price should be a valid number")
            .positive("Price cannot be negative")
            .required("Price is required"),
        discountPrice: yup
            .number()
            .typeError("Discount price should be a valid number")
            .positive("Discount price cannot be negative")
            .required("Discount price is required"),
        stockCount: yup
            .number()
            .typeError("Stock count shoule be a valid number")
            .positive("Stock count cannot be negative")
            .integer("Stock count cannot be in fractions")
            .required("Stock count is required"),
        description: yup.string().max(150).required("Description is required"),
        images: yup.array().min(1, "Please upload atleast one image.").required("Please upload atleast one image."),
        productVariants: yup.array().of(createProductVariantSchema).min(1, "Please create atleast one variant.").required("Please create atleast one variant."),
        attributeOptions: yup.object().required("Please provide valid attribute options")
    })
    .required();

module.exports = createProductRequestSchema