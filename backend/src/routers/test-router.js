const { Router } = require('express');
const { driverModel, rideModel, telegramSessionModel } = require('../models');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function getMessageObject(id, text) {
    return {
        message: {
            chat: {
                type: 'private',
                id: id
            },
            from: {
                id: id,
                is_bot: true,
                first_name: "No Name"
            },
            text: text,
            message_id: getRandomInt(1000000, 9999999),
            date: new Date(),
        }
    }
}

function testRouter(bot) {
    const router = Router();

    router.post('/telegram', async (req, res) => {
        const { id } = req.body;

        await bot.handleUpdate(getMessageObject(id, '/start'));
        await bot.handleUpdate(getMessageObject(id, 'ENTER_NAME'));
        await bot.handleUpdate(getMessageObject(id, 'Test Name'));
        await bot.handleUpdate(getMessageObject(id, 3808805553535));

        await bot.handleUpdate(getMessageObject(id, 'CREATE_RIDE'));
        await bot.handleUpdate(getMessageObject(id, 'FROM_UKRAINE'));
        await bot.handleUpdate(getMessageObject(id, 'Test City From'));
        await bot.handleUpdate(getMessageObject(id, 'Test City Destination'));
        await bot.handleUpdate(getMessageObject(id, 'TEST_DATE'));
        await bot.handleUpdate(getMessageObject(id, 'SET_CAR'));

        const drivers =  await driverModel.find({ _telegramId: id });
        const deletedRides = await rideModel.deleteMany({ driver: { $in: drivers }});
        const deletedDrivers = await driverModel.deleteMany({ _telegramId: id });
        const deletedSession = await telegramSessionModel.deleteMany({ _telegramId: id });

        res.send({
            'deleted_rides': deletedRides.deletedCount,
            'deleted_drivers': deletedDrivers.deletedCount,
            'deleted_session': deletedSession.deletedCount,
        });
    });

    return router;
}

module.exports = { testRouter };
