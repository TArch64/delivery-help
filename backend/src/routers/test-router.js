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

async function waitAfter(action, ms = 10) {
    await action();
    return new Promise(resolve => { setTimeout(() => resolve(), ms) } );
}

function testRouter(bot) {
    const router = Router();

    router.post('/telegram', async (req, res) => {
        try {
            const { id } = req.body;

            await waitAfter(() => bot.handleUpdate(getMessageObject(id, '/start')), 100);

            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 'CREATE_DRIVER')), 100);
            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 'ENTER_NAME')), 100);
            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 'Test Name')), 100);
            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 3808805553535)), 100);

            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 'CREATE_RIDE')), 100);
            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 'FROM_UKRAINE')), 100);
            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 'Test City From')), 100);
            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 'Test City Destination')), 100);
            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 'TEST_DATE')), 100);
            await waitAfter(() => bot.handleUpdate(getMessageObject(id, 'SET_CAR')), 100);

            const drivers =  await driverModel.find({ _telegramId: id });
            const deletedRides = await rideModel.deleteMany({ driver: { $in: drivers }});
            const deletedDrivers = await driverModel.deleteMany({ _telegramId: id });
            const deletedSession = await telegramSessionModel.deleteMany({ _telegramId: id });

            res.send({
                'deleted_rides': deletedRides.deletedCount,
                'deleted_drivers': deletedDrivers.deletedCount,
                'deleted_session': deletedSession.deletedCount,
            });
        } catch (error) {
            res.status(500);
        }
    });

    return router;
}

module.exports = { testRouter };
