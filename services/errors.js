module.exports = {
    errors: (err, req, res, next) => {
        if (!err) return
        console.log(err)
        let { statusCode, message } = err
        statusCode = statusCode || 404
        const resp = {
            status: "error",
            statusCode,
            message
        }
        res.status(statusCode).json(resp)
    }
}