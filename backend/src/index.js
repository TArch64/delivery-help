const { createServer } = require("http");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const { driverRouter, rideRouter, authRouter, testRouter } = require('./routers');
const { rideModel } = require('./models');
const { initializeSocketServer } = require('./socket');
const { initializeBotServer } = require('./bot');
const { seedData } = require('./seed');
const { authMiddleware } = require('./middlewares');

const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_HOST,
    MONGO_PORT,
    BACKEND_SECRET,
    TELEGRAM_BOT_TOKEN,
    FRONTEND_ORIGIN
} = process.env;

async function bootstrap() {
    await mongoose.connect(`mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_USERNAME}`);

    const rideCount = await rideModel.count();

    if (!rideCount) await seedData();

    const app = express();

    app.use(cookieParser(BACKEND_SECRET));
    app.use(express.json());
    app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

    app.use('/api/v1', authMiddleware);
    app.use('/api/v1', driverRouter, rideRouter, authRouter);

    const httpServer = createServer(app);

    initializeSocketServer(httpServer);

    httpServer.listen(8080, () => {
        console.log('Server was started');
    });

    if (TELEGRAM_BOT_TOKEN) {
        const bot = initializeBotServer(TELEGRAM_BOT_TOKEN);
        bot.launch();
        app.use('/api/test', testRouter(bot));
    }
}

bootstrap();
