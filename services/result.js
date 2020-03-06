module.exports = {
    result: (req, res) => {
        if (req.data instanceof Error) {
            throw (req.data)
        } else {
            res.json({ success: !req.fail, data: req.data, message: req.message })
        }
    }
}