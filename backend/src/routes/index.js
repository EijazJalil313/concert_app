const express = require("express");

const concertRoutes = require("./v1/concertRoutes");
const authRoutes = require("./v1/authRoutes")

const router = express.Router()

router.use("/v1/concert", concertRoutes);
router.use("/v1/auth",authRoutes);

module.exports = router;