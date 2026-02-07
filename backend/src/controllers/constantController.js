const { PrismaClient } = require("@prisma/client");
const logger = require("../config/logger");
const { SINGLE_CONCERT_ID } = require("../config/constants");

const prisma = new PrismaClient();

const getConcertCtrl = async (req,res) => {
    try{
        const concert = await prisma.concert.findUnique({
            where:{id:SINGLE_CONCERT_ID},
            include:{categories:true}
        });
        
        if(!concert) {
            logger.warn("Concert not found with ID:", SINGLE_CONCERT_ID);
            return res.status(404).json({error:"Concert not found"});
        }
        
        res.json(concert)

    }
    catch(err){
        logger.error("Get concert Error",{err, message: err.message, code: err.code});
        res.status(500).json({error: err.message || "Database connection error"})
    }
}


module.exports = {getConcertCtrl};