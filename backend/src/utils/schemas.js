const z = require("zod");


const emailSignUpSchema = z.object({
    email:z.string().email(),
    password:z.string().min(8),
    name:z.string().optional(),
});

const otpVerifySchema = z.object({
    name:z.string().optional(),
    phoneNumber:z.string().optional(),
    gender:z.string().optional(),
    birthday:z.string().optional(),
    state:z.string().optional(),
});

const bookingSchema = z.object({
    categoryId:z.string(),
    seats:z.number().min(1).max(10),
});


module.exports = {
    emailSignUpSchema,
    otpVerifySchema,
    bookingSchema,
}