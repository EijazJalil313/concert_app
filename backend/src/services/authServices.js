const {PrismaClient} = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Redis = require("ioredis");
const { generateAccessToken, generateRefreshToken, verifyToken } = require("../utils/jwt");
const { sendWelcomeEmail, sendOTP } = require("./emailService");
const logger = require("../config/logger");

let redis = null;
try {
    if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL);
        redis.on("error", (err) => {
            logger.warn("Redis error", { err });
        });
    }
} catch (err) {
    logger.warn("Failed to initialize Redis", { err });
    redis = null;
}

// Fallback in-memory store for OTPs when Redis is unavailable
const inMemoryOtp = new Map();

const prisma = new PrismaClient();


const hashPassword = async (password) => bcrypt.hash(password,10);

const generateNumericOTP = () => {
    const n = crypto.randomInt(0,1000000);
    return n.toString().padStart(6,"0")
}

// Development helper: generate OTP and return it (do NOT enable in production)
const devGenerateOTP = async (email, name) => {
    if (!email) throw new Error('Email is required');
    const otp = generateNumericOTP();

    if (redis) {
        await redis.set(`otp:${email}`, otp, 'EX', 300);
    } else {
        inMemoryOtp.set(email, { otp, expires: Date.now() + 300000 });
    }

    // try to send email, but don't fail if it errors
    try {
        await sendOTP(email, otp, { name: name || 'N/A', email });
    } catch (err) {
        logger.warn('devGenerateOTP: sendOTP failed', { err });
    }

    return otp;
}

const signUpEmail = async (data) => {
    const { email, password, name } = data || {};
    if (!email) throw new Error('Email is required');

    const existingUser = await prisma.user.findUnique({ where: { email } });

    // If user already exists, send OTP so they can verify/login via OTP
    if (existingUser) {
        const otp = generateNumericOTP();

        if (redis) {
            await redis.set(`otp:${email}`, otp, 'EX', 300);
        } else {
            inMemoryOtp.set(email, { otp, expires: Date.now() + 300000 });
        }

        await sendOTP(email, otp, { name: existingUser.profile?.name || name || 'N/A', email });
        return { message: 'Otp Sent' };
    }

    if (!password) throw new Error('Password is required for new signup');

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
        data: { email: email, password: hashedPassword }
    });

    if (name) {
        await prisma.profile.create({ data: { userId: user.id, name } });
    }

    const otp = generateNumericOTP();

    if (redis) {
        await redis.set(`otp:${email}`, otp, 'EX', 300);
    } else {
        inMemoryOtp.set(email, { otp, expires: Date.now() + 300000 });
    }

    await sendOTP(email, otp, { name: name || 'N/A', email });

    return { message: 'Otp Sent' };
};



const verifyOTP = async (data) => {
    const{email,otp} = data;
    let storedOTP = null;
    if (redis) {
        storedOTP = await redis.get(`otp:${email}`);
    } else {
        const rec = inMemoryOtp.get(email);
        if (rec && rec.expires > Date.now()) storedOTP = rec.otp;
    }

    if (storedOTP !== otp) throw new Error("Invalid OTP");

    const user = await prisma.user.findUnique({ where: { email } });
    if(!user) throw new Error("user not found")

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const hashRefresh = await bcrypt.hash(refreshToken,10);

    await prisma.user.update({
        where:{id:user.id},
        data:{refreshToken:hashRefresh}
    })

    if (redis) {
        await redis.del(`otp:${email}`);
    } else {
        inMemoryOtp.delete(email);
    }
    await sendWelcomeEmail(email, {name: user.profile?.name || "user"});

    return{accessToken,refreshToken};
};

const login = async(data) => {
    const {email,password} = data;
    const user = await prisma.user.findUnique({where:{email}});
    if(!user || !await bcrypt.compare(password,user.password)){
        throw new Error("Invalid Credentials");
    }

    
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const hashRefresh = await bcrypt.hash(refreshToken,10);

    await prisma.user.update({
        where:{id:user.id},
        data:{refreshToken:hashRefresh}
    })
    return{accessToken,refreshToken};
};


const refresh = async (token) => {
    let decoded;

    try {
        decoded = verifyToken(token, process.env.REFRESH_SECRET);
    } catch (err) {
        throw new Error("Invalid refresh token");
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
    });

    if (!user || !(await bcrypt.compare(token, user.refreshToken))) {
        throw new Error("Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    const hashRefresh = await bcrypt.hash(newRefreshToken,10);

    await prisma.user.update({
            where:{id:user.id},
            data:{refreshToken:hashRefresh}
    })

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};


const logout = async(userId) => {
    await prisma.user.update({
        where:{id:userId},
        data:{refreshToken:null}
    })
};


module.exports = {signUpEmail,verifyOTP,login,refresh,logout, devGenerateOTP}

