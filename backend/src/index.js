const { createServer } = require("http");
const express = require('express');
const mongoose = require('mongoose');
const { driverRouter, rideRouter } = require('./routers');
const { rideModel } = require('./models');
const { initializeSocketServer } = require('./socket');
const { seedData } = require('./seed');

async function bootstrap() {
    const { MONGO_USERNAME, MONGO_PASSWORD } = process.env;
    await mongoose.connect(`mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017/${MONGO_USERNAME}`);

    const rideCount = await rideModel.count();
    if (rideCount == 0) {
        await seedData();
    }

    const app = express();
    app.use('/api/v1', driverRouter, rideRouter);


    const httpServer = createServer(app);
    initializeSocketServer(httpServer);

    httpServer.listen(8080, () => {
        console.log('Server was started');
    });
};

bootstrap();
