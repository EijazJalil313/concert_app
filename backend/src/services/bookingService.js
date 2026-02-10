const { PrismaClient } = require("@prisma/client");
const { SINGLE_CONCERT_ID } = require("../config/constants");
const logger = require("../config/logger");
const { sendOrderConfirmation } = require("./emailService");

const prisma = new PrismaClient();

// Status constants (status is Int in schema)
const STATUS = {
    PENDING: 0,
    CONFIRMED: 1,
    CANCELLED: 2,
    EXPIRED: 3,
};


const getPendingBookings = async (userId, categoryId = null) => {
    const where = {
        userId,
        concertId: SINGLE_CONCERT_ID,
        status: STATUS.PENDING,
        expiresAt: { gt: new Date() }
    };

    if (categoryId) {
        where.categoryId = categoryId;
    };

    return await prisma.booking.findFirst({
        where,
        include: { category: { select: { id: true, name: true, price: true } } }
    })
};


const createBooking = async (userId, data) => {
    const { categoryId, seats } = data;

    const pending = await getPendingBookings(userId, categoryId);
    if (pending) {
        throw new Error(
            "you have an active booking session for this category.complete payment or wait for release"
        );
    };

    // const queueStatus = await getQueueStatus(userId,SINGLE_CONCERT_ID);
    // if(queueStatus.highDemand && (queueStatus.timeSlot && new Date() > queueStatus.timeSlot)){
    //     throw new Error("high demand: wait for your slot or it expired")
    // }


    return prisma.$transaction(async (tx) => {
        const category = await tx.ticketCategory.findUnique({
            where: { id: categoryId }
        });

        if (!category || category.concertId !== SINGLE_CONCERT_ID || category.availableSeats < seats) {
            throw new Error("Invalid category or not enough seats")
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

        const booking = await tx.booking.create({
            data: {
                userId,
                concertId: SINGLE_CONCERT_ID,
                categoryId,
                seats: String(seats),
                status: STATUS.PENDING,
                bookedAt: now,
                expiresAt
            }
        });

        await tx.ticketCategory.update({
            where: { id: categoryId },
            data: { availableSeats: { decrement: seats } },
        });
        await tx.concert.update({
            where: { id: SINGLE_CONCERT_ID },
            data: { availableSeats: { decrement: seats } },
        });

        logger.info("Booking created", { bookingId: booking.id, expiresAt });

        return tx.booking.findUnique({
            where: { id: booking.id },
            include: { category: { select: { id: true, name: true, price: true } } }
        });
    })
};





const confirmBooking = async (bookingId, userId) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking || booking.userId !== userId || new Date() > booking.expiresAt) {
        throw new Error("Invalid or expired")
    };

    await prisma.booking.update({
        where: { id: bookingId },
        data: { status: STATUS.CONFIRMED }
    });


    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });

    const concert = await prisma.concert.findUnique({
        where: { id: booking.concertId },
    });

    await sendOrderConfirmation(
        user.email, {
        seats: booking.seats, concertName: concert.name
    },
        {
            name: user.profile?.name || 'N/A', email: user.email,
        },)

        logger.info("Booking Confirmed", { bookingId })
};


const  cancelPendingBook = async (userId,categoryId) => {
    const pending = await getPendingBookings(userId,categoryId);
    if(!pending) throw new Error("no active session for this category")


    await prisma.$transaction(async (tx) => {

        await tx.ticketCategory.update({
            where:{id:categoryId},
            data:{availableSeats:{increment:parseInt(pending.seats)}}
        });
        await tx.concert.update({
            where:{id:SINGLE_CONCERT_ID},
            data:{availableSeats:{increment:parseInt(pending.seats)}}
        });

        await tx.booking.update({
            where:{id:pending.id},
            data:{status:STATUS.CANCELLED}
        })

    });

    logger.info("Pending booking Cancelled",{bookingId:pending.id});

    return{message:"Cancelled"};
};


const cleanExpiredBookings = async () => {
    const startTime = Date.now();

    await prisma.$transaction(async (tx) => {
        const expired = await tx.booking.findMany({
            where:{status:STATUS.PENDING,expiresAt:{lt:new Date()}},
            select:{id:true,categoryId:true,seats:true},
        });

        if(expired.length === 0) {
            logger.info("No expired bookings to clean");
            return;
        }

        // Batch update all expired bookings to EXPIRED status
        const expiredIds = expired.map(b => b.id);
        await tx.booking.updateMany({
            where:{id:{in:expiredIds}},
            data:{status:STATUS.EXPIRED}
        });

        // Group bookings by category and calculate total seats to return
        const categorySeats = expired.reduce((acc, b) => {
            acc[b.categoryId] = (acc[b.categoryId] || 0) + parseInt(b.seats);
            return acc;
        }, {});

        // Update each category's available seats
        const categoryUpdates = Object.entries(categorySeats).map(([categoryId, seats]) =>
            tx.ticketCategory.update({
                where:{id:categoryId},
                data:{availableSeats:{increment:seats}},
            })
        );

        // Calculate total seats to return to concert
        const totalSeats = expired.reduce((sum, b) => sum + parseInt(b.seats), 0);
        
        // Update concert available seats
        const concertUpdate = tx.concert.update({
            where:{id:SINGLE_CONCERT_ID},
            data:{availableSeats:{increment:totalSeats}}
        });

        await Promise.all([...categoryUpdates, concertUpdate]);

        logger.info("clean expired bookings",{
            count:expired.length,
            duration:Date.now() - startTime
        })
    },{
        timeout:30000,
        maxWait:10000,
    })
};



module.exports = {
    createBooking,
    confirmBooking,
    getPendingBookings,
    cleanExpiredBookings,
    cancelPendingBook,
}