const errorMessages = require("../constants/errorMessages")

module.exports = (error) => {
    if (!error)
        error = errorMessages.SOMETHING_WENT_WRONG
    return { errors: [error] }
}