const logger = require("../config/logger");
const { createBooking, confirmBooking, getPendingBookings, cancelPendingBook } = require("../services/bookingService")





const createBookingCtrl = async (req, res) => {
    try {
        const booking = createBooking(req.user.userId, req.body);
        res.json(booking);
    }catch(err){
        logger.error("create booking error",{
            error:err?.stack || err.message || err,
        });
        const status = err?.name == "ValidationError" || err?.name == "PrismaClientValidationError" ? 400 : 500;
        res.status(status).json({error:err?.message || "Internal server error"})
    }
};


const confirmBookingCtrl = async (req,res) => {
    try {
        const result = confirmBooking(req.params.id, req.user.userId);
        res.json(result);
    }catch(err){
        logger.error("Confirm booking error",{
            error:err?.stack || err.message || err,
        });
        const status = err?.name == "ValidationError" || err?.name == "PrismaClientValidationError" ? 400 : 500;
        res.status(status).json({error:err?.message || "Internal server error"})
    }
};



const getPendingBookingCtrl = async(req,res) => {
    try{
        let {categoryId} = req.query;
        if(!categoryId){
            return res.status(400).json({error:"Category Id required"})
        }

        categoryId = String(categoryId).trim();
        const pending = await getPendingBookings(req.user.userId,categoryId);
        res.json(pending || null);
    }catch(err){
        logger.error("Get Pending error",{
            message:err.message,
            name:err.name,
            stack:err.stack,
            categoryId:req.query.categoryId,
        });

        const status = err?.name == "ValidationError" || err?.name == "PrismaClientValidationError" ? 400 : 500;
        res.status(status).json({error:err?.message || "Internal server error"})
    }

};



const cancelPendingBookingCtrl = async (req,res) => {
    try{
        let {categoryId} = req.query;
        if(!categoryId){
            return res.status(400).json({error:"Category Id required"})
        }
        categoryId = String(categoryId).trim();
        const result = await cancelPendingBook(req.user.userId,categoryId);
        req.json(result);


    }catch(err){
        logger.error("Cancel Pending error",{
            message:err.message,
            name:err.name,
            stack:err.stack,
            categoryId:req.query.categoryId,
        });

        const status = err?.name == "ValidationError" || err?.name == "PrismaClientValidationError" ? 400 : 500;
        res.status(status).json({error:err?.message || "Internal server error"})
    }
}


module.exports = {
    createBookingCtrl,
    confirmBookingCtrl,
    getPendingBookingCtrl,
    cancelPendingBookingCtrl
}


