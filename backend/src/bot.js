const { Telegraf } = require('telegraf');
const Calendar = require('telegraf-calendar-telegram');
const { driverModel, rideModel, telegramSessionModel } = require('./models');
const { broadcastNewRide } = require('./socket');

function sessionMiddleware(type) {
    return async (ctx, next) => {
        let telegramId;
        if (type == 'action') {
            telegramId = ctx.update.callback_query.from.id;
        } else if (type == 'chat') {
            telegramId = ctx.message.chat.id;
        } else {
            telegramId = ctx.message.chat.id;
        }
        ctx.driver = await driverModel.findOne({ _telegramId: telegramId });
        let session = await telegramSessionModel.findOne({ _telegramId: telegramId });

        if (!session) {
            session = await telegramSessionModel.create({ _telegramId: telegramId, process: 'IDLE', step: 0 });
        }
        ctx.session = session;
        return next();
    }
}

function afterButton(ctx, next) {
    ctx.deleteMessage();
    return next();
}

async function helpRoute(ctx, next) {
    await ctx.reply(ctx.message.chat.id);

    if (ctx.driver) {
        await ctx.reply('/ride - Поїхали!');
        await ctx.reply('/profile - Мій профіль');
    } else {
        try {
            await ctx.reply('Для початку работи, представтеся');
            ctx.session.process = 'USER_REGISTRATION';
            ctx.session.step = 0;
            await ctx.session.save();
            showMessage(ctx, next);
        } catch (error) {
            console.log('!!!!!!!!!!!!!!! ERROR');
            console.log(error);
        }
        
    }
}

function showMessage(ctx, next) {
    const messagesDict = {
        "IDLE": {
            0: () => helpRoute(ctx),
        },
        "USER_REGISTRATION": {
            0: async () => await ctx.reply('Як вас звати?', {
                reply_markup: {
                    inline_keyboard: [
                        [ { text: `Це моє ім\'я ${ctx.message.chat.first_name} ${ctx.message.chat.last_name}`, callback_data: "USE_PROFILE_NAME" } ],
                        [ { text: "Ні, я введу його самостійно", callback_data: "ENTER_NAME" } ]
                    ]
                }
            }),
            1: async () => await ctx.reply('Введіть ваше ім\'я'),
            2: async () => await ctx.reply('Введіть ваш номер', { reply_markup: { one_time_keyboard: true, keyboard: [[{text: 'Відправити мій телеграм контакт 📲', request_contact: true}]] } } )
        },
        "RIDE_REGISTRATION": {
            0: async () => await ctx.reply('Ви зараз за кордоном?', {
                reply_markup: {
                    inline_keyboard: [
                        [ { text: "Так за кордонм", callback_data: "FROM_ABROAD" } ],
                        [ { text: "Ніт, заре в Україні 🇺🇦 ;)", callback_data: "FROM_UKRAINE" } ]
                    ]
                }
            }),
            1: async () => await ctx.reply('Яка країна?'),
            2: async () => await ctx.reply('Місто?'),
            3: async () => await ctx.reply('Введіть кінцевий населенний пункт призначення'),
            4: async () => {
                await ctx.reply('Дата вашої поїздки', ctx.calendar.getCalendar())
            },
            5: async () => await ctx.reply('Ваш тип авто?', {
                reply_markup: {
                    inline_keyboard: [
                        [ { text: "Легковушка ( < 2т)", callback_data: "SET_CAR" } ],
                        [ { text: "Грузова ( < 10т)", callback_data: "SET_VAN" } ],
                        [ { text: "Фура ( > 10т)", callback_data: "SET_TRUCK" } ]
                    ]
                }
            }),
        }
    }
    messagesDict[ctx.session.process][ctx.session.step]();

    if (next) {
        return next();
    }
}

function setProcessAndStepMiddleware(process, step) {
    return async (ctx, next) => {
        ctx.session.process = process;
        ctx.session.step = step;
        await ctx.session.save();
        return next();
    }
}

async function profileRoute(ctx) {
    if (ctx.driver) {
        await ctx.reply(`Ім'я: ${ctx.driver.name}`);
        await ctx.reply(`Телефон: ${ctx.driver.phone}`);
    } else {
        await ctx.reply('Команда доступна лише для зареєстрованих водіїв');
    }
}

async function newUserRoute(ctx, next) {
    if (ctx.driver) {
        await ctx.reply('Реестрація доступна лише новим користувачам');
    } else {
        ctx.session.process = 'USER_REGISTRATION';
        ctx.session.step = 0;
        await ctx.session.save();
        showMessage(ctx, next);
    }
}

async function newRideRoute(ctx, next) {
    ctx.session.process = 'RIDE_REGISTRATION';
    ctx.session.step = 0;
    await ctx.session.save();

    if (ctx.driver) {
        showMessage(ctx, next);
    } else {
        await ctx.reply('Команда доступна лише для зареєстрованих водіїв');
    }
}

async function clearDev(ctx) {
    const drivers =  await driverModel.find({ _telegramId: { $ne: null }});
    const rides = await rideModel.deleteMany({ driver: { $in: drivers }});

    const dm = await driverModel.deleteMany({ _telegramId: { $ne: null }});
    const s = await telegramSessionModel.deleteMany({});

    await ctx.reply(`Deleted drivers: ${dm.deletedCount}`);
    await ctx.reply(`Deleted sessions: ${s.deletedCount}`);
    await ctx.reply(`Deleted rides: ${rides.deletedCount}`)
}

async function processMessage(ctx, next) {
    const actionDict = {
        "IDLE": {
            0: async () => { 
                if (ctx.message.text == 'CREATE_RIDE') {
                    ctx.session.step = 0;
                    ctx.session.process = 'RIDE_REGISTRATION';
                    await ctx.session.save();
                } else {
                    showMessage(ctx, next); 
                }
        }
        },
        "USER_REGISTRATION": {
            0: async () => { 
                if (ctx.message.text == 'ENTER_NAME') {
                    ctx.session.step = 1;
                    await ctx.session.save();
                } else {
                    showMessage(ctx, next); 
                }
            },
            1: async () => {
                ctx.session.name = ctx.message.text;
                ctx.session.step = 2;
                await ctx.session.save();
                showMessage(ctx, next);
            },
            2: async () => {
                ctx.session.phone = ctx.message.text;
                ctx.session.step = 0;
                ctx.session.process = 'IDLE';
                await ctx.session.save();

                ctx.driver = await driverModel.create({
                    _telegramId: ctx.session._telegramId,
                    name: ctx.session.name,
                    phone: ctx.session.phone,
                    grade: 'NOT VERIFIED'
                });

                await ctx.reply('Дякуємо за реестрацію');
                setTimeout(() => {
                    helpRoute(ctx, next);
                }, 200);
            }
        },
        "RIDE_REGISTRATION": {
            0: async () => { 
                if (ctx.message.text == 'FROM_UKRAINE') {
                    ctx.session.step = 2;
                    ctx.session.fromCountry = 'Україна';
                    await ctx.session.save();
                } else {
                    return next(); 
                }
            },
            1: async () => { 
                ctx.session.fromCountry = ctx.message.text;
                ctx.session.step = 3;
                await ctx.session.save();
                showMessage(ctx, next);
            },
            2: async () => { 
                ctx.session.fromCity = ctx.message.text;
                ctx.session.step = 3;
                await ctx.session.save();
                showMessage(ctx, next);
            },
            3: async () => { 
                ctx.session.destinationCity = ctx.message.text;
                ctx.session.step = 4;
                await ctx.session.save();
                showMessage(ctx, next);
            },
            4: async () => {
                if (ctx.message.text == 'TEST_DATE') {
                    ctx.session.departureTime = '2022-05-01';
                    ctx.session.step = 5;
                    await ctx.session.save();
                } else {
                    showMessage(ctx, next);
                }
            },
            5: async () => { 
                if (ctx.message.text == 'SET_CAR') {
                    setVehicle('CAR')(ctx, next);
                } else {
                    return next(); 
                }
            },
        }
    }
    console.log('processMessage!!!!!!!')
    console.log(ctx.session.process, ctx.session.step);
    await actionDict[ctx.session.process][ctx.session.step]();
}

function setVehicle(vehicleType) {
    return async(ctx, next) => {
        ctx.session.vehicle = vehicleType;
        ctx.session.step = 0;
        ctx.session.process = 'IDLE';
        await ctx.session.save();

        const ride = await rideModel.create({
            driver: ctx.driver._id,
            from: {
                country: ctx.session.fromCountry,
                city: ctx.session.fromCity
            },
            destination: {
                country: 'Україна',
                city: ctx.session.destinationCity
            },
            departureTime: ctx.session.departureTime,
            vehicle: ctx.session.vehicle,
            status: 'PENDING'
        });
        await ride.populate('driver');
        broadcastNewRide(ride);

        await ctx.reply('Дякуємо! Очікуйте на дзвінок координатора');

        helpRoute(ctx, next);
    }
}

function initializeBotServer(token) {
    const bot = new Telegraf(token);
    const calendar = new Calendar(bot);
    bot.use(async (ctx, next) => {
        console.log('TEST MIDDLEWARE');
        console.dir(ctx, { depth: 2 });
        return await next();
    });

    bot.use(async (ctx, next) => {
        ctx.calendar = calendar;
        return next()
    });

    bot.action(/calendar-telegram-date-[\d-]+/g, afterButton, sessionMiddleware('action'), async (ctx, next) => {
        let date = ctx.match[0].replace("calendar-telegram-date-", "");
        ctx.session.departureTime = date;
        ctx.session.step = 5;
        await ctx.session.save();
        showMessage(ctx, next);
    });
    calendar.setDateListener((ctx, date) => {});


    bot.start(sessionMiddleware('chat'), helpRoute);
    bot.help(sessionMiddleware('chat'), helpRoute)
    // bot.command('/new', sessionMiddleware('chat'), newUserRoute);

    bot.on('contact', sessionMiddleware('chat'), async(ctx, next) => {
        ctx.session.phone = ctx.message.contact.phone_number;
        ctx.session.step = 0;
        ctx.session.process = 'IDLE';
        await ctx.session.save();

        ctx.driver = await driverModel.create({
            _telegramId: ctx.session._telegramId,
            name: ctx.session.name,
            phone: ctx.session.phone,
            grade: 'NOT VERIFIED'
        });

        await ctx.reply('Дякуємо за реестрацію');
        setTimeout(() => {
            helpRoute(ctx, next);
        }, 200);
    });
    
    bot.action(
        'USE_PROFILE_NAME',
        afterButton,
        sessionMiddleware('action'),
        async (ctx, next) => {
            ctx.session.name = `${ctx.update.callback_query.from.first_name} ${ctx.update.callback_query.from.last_name}`;
            await ctx.session.save();

            return next();
        },
        setProcessAndStepMiddleware("USER_REGISTRATION", 2),
        showMessage
    );
    bot.action(
        'ENTER_NAME',
        afterButton,
        sessionMiddleware('action'),
        setProcessAndStepMiddleware("USER_REGISTRATION", 1),
        showMessage
    );

    bot.action(
        'FROM_UKRAINE',
        afterButton,
        sessionMiddleware('action'),
        async (ctx, next) => {
            ctx.session.fromCountry = 'Україна';
            await ctx.session.save();

            return next();
        },
        setProcessAndStepMiddleware("RIDE_REGISTRATION", 2),
        showMessage
    );

    bot.action(
        'FROM_ABROAD',
        afterButton,
        sessionMiddleware('action'),
        async (ctx, next) => {
            ctx.session.fromСity = null;
            await ctx.session.save();

            return next();
        },
        setProcessAndStepMiddleware("RIDE_REGISTRATION", 1),
        showMessage
    );

    bot.command('/ride', sessionMiddleware('chat'), newRideRoute);
    bot.command('/profile', sessionMiddleware('chat'), profileRoute);
    bot.command('/clearDev', sessionMiddleware('chat'), clearDev);


    bot.action('SET_CAT', afterButton, sessionMiddleware('action'), setVehicle('CAR'));
    bot.action('SET_VAN', afterButton, sessionMiddleware('action'), setVehicle('VAN'));
    bot.action('SET_TRUCK', afterButton, sessionMiddleware('action'), setVehicle('TRUCK'));


    bot.on('text', sessionMiddleware('chat'), processMessage);

    // bot.launch();

    return bot;
}

module.exports = { initializeBotServer };
