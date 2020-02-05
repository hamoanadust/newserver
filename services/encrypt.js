const bcrypt = require("bcryptjs");
const saltRounds = require("../config/config.json").saltRounds;

const hash = async data => {
    return await bcrypt.hash(data, saltRounds);
};

const compare = async (a, b) => {
    return await bcrypt.compare(a, b);
};

module.exports = {
    hash,
    compare
}