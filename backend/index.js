require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { globalRateLimiter } = require("./src/middlewares/rateLimit");
const errorHandler = require("./src/middlewares/errorHandler");
const logger = require("./src/config/logger")
const routes = require("./src/routes/index")
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(globalRateLimiter);

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw`db.adminCommand({ping: 1})`;
        res.json({ status: "ok", database: "connected" });
    } catch (err) {
        logger.error("Database health check failed", { err: err.message });
        res.status(500).json({ status: "error", database: "disconnected", error: err.message });
    }
});

app.use(errorHandler)

app.use("/api",routes)

const PORT = 3000;

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`)
})