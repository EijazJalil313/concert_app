const { getConcertCtrl } = require("../../controllers/constantController");

const express = require("express")

const router = express.Router();
router.get("/",getConcertCtrl);

module.exports = router;