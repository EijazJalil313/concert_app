const express = require("express");
const { authMiddleware } = require("../../middlewares/auth");
const {authLimiter} = require("../../middlewares/rateLimit");
const { confirmBookingCtrl, getPendingBookingCtrl, cancelPendingBookingCtrl, createBookingCtrl } = require("../../controllers/bookingController");
const validationMiddleware = require("../../middlewares/validation");
const {bookingSchema} = require("../../utils/schemas");


const router = express.Router();

router.post("/",authMiddleware,authLimiter,validationMiddleware(bookingSchema),createBookingCtrl);
router.patch("/:id/confirm",authMiddleware,confirmBookingCtrl);
router.get("/pending",authMiddleware,getPendingBookingCtrl);
router.delete("/pending",authMiddleware,cancelPendingBookingCtrl);


module.exports = router;