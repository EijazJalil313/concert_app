const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET ;

const generateAccessToken = (userId) => {
    return jwt.sign({userId}, JWT_SECRET, {expiresIn:"9h"});
}
const generateRefreshToken = (userId) => {
    return jwt.sign({userId}, REFRESH_SECRET, {expiresIn:"7d"});
}
const verifyToken = (token, secret) => {
    return jwt.verify(token, secret);
}

module.exports = {generateAccessToken,generateRefreshToken,verifyToken};