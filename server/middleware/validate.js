const validate = (schema) => {
    return async function (req, res, next) {
        if (!schema) {
            return res.status(500).send()
        }
        try {
            await schema.validate(req.body, { abortEarly: false })
        } catch (error) {
            console.log("Error", error)
            return res.status(400).send({ error })
        }
        next()
    }
}

module.exports = validate
