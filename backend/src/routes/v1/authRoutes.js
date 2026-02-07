const express = require("express");

const {authLimiter} = require("../../middlewares/rateLimit");
const validationMiddleware = require("../../middlewares/validation");
const { signUpEmailCtrl, verifyOTPCtrl, loginEmailCtrl, logoutCtrl, refreshCtrl, devGenerateOTPCtrl } = require("../../controllers/authController");
const { emailSignUpSchema, otpVerifySchema } = require("../../utils/schemas");

const router = express.Router();


router.post("/signup/email",authLimiter,validationMiddleware(emailSignUpSchema),signUpEmailCtrl);
router.post("/verify-otp",authLimiter,validationMiddleware(otpVerifySchema),verifyOTPCtrl);
router.post("/login/email",authLimiter,validationMiddleware(emailSignUpSchema),loginEmailCtrl);
router.post("/refresh",refreshCtrl);
router.post("/logout",logoutCtrl);

// Development helper: generate and return OTP (only non-production)
if (process.env.NODE_ENV !== 'production') {
	router.post('/dev/otp', (req, res, next) => authLimiter(req, res, next), devGenerateOTPCtrl);
}

module.exports = router;

