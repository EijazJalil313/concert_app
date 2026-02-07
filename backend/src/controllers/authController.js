const logger = require("../config/logger");
const { signUpEmail, verifyOTP, login, refresh, logout, devGenerateOTP } = require("../services/authServices");



const signUpEmailCtrl = async(req,res) => {
        try{
            const result = await signUpEmail(req.body);
            logger.info("SignUp success",{email:req.body.email});
            res.json(result);
        }catch(err){
            logger.error("Sign Up Error", { message: err.message, stack: err.stack, body: req.body });
            res.status(400).json({ error: err.message || 'Sign up failed' });
        }
};



const verifyOTPCtrl = async(req,res) => {
    try{
        const tokens = await verifyOTP(req.body);
        res.json(tokens)
    }catch(err){
        logger.error("OTP verify Up Error", { message: err.message, stack: err.stack, body: req.body });
        res.status(400).json({ error: err.message || 'OTP verification failed' })
    }
}

const loginEmailCtrl = async(req,res) => {
    try{
        const tokens = await login(req.body);
        logger.info("Login Success",{email:req.body.email});
        res.json(tokens);

    }catch(err){
        logger.error("OTP verify Up Error", { message: err.message, stack: err.stack, body: req.body });
        res.status(400).json({ error: err.message || 'Login failed' })
    }
};

const devGenerateOTPCtrl = async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not allowed in production' });
    }

    try {
        const { email, name } = req.body || {};
        if (!email) return res.status(400).json({ error: 'Email is required' });
        const otp = await devGenerateOTP(email, name);
        return res.json({ otp });
    } catch (err) {
        logger.error('Dev OTP generation failed', { err, body: req.body });
        return res.status(500).json({ error: 'Failed to generate OTP' });
    }
};



const refreshCtrl = async(req,res) => {
    try{
        const {refreshToken} = req.body;

        if(!refreshToken || typeof refreshToken !== "string") {
            return res.status(400).json({error:"Refresh Token is required"})
        }
        const tokens = await refresh(refreshToken);
        res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        })
        }
    catch(err){
        logger.error("Refresh token failed",{
            error:err.message,
            body:req.body,
    })
    res.status(401).json({error:"Invalid or expired refresh token"})
}};



const logoutCtrl = async (req, res) => {
  try {
    await logout(req.user.userId);

    logger.info("Logout success", { userId: req.user.userId });

    res.json({ message: "Logged out" });
  } catch (err) {
    logger.error("Logout error", { err });

    res.status(500).json({ error: err.message });
  }
};



module.exports = {
    signUpEmailCtrl,
    verifyOTPCtrl,
    loginEmailCtrl,
    refreshCtrl,
    logoutCtrl,
    devGenerateOTPCtrl,
}
