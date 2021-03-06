const { Markup } = require('telegraf');
const { driverComposerOptional, nonFinishedRidesComposerOptional, isNonFinisehdRides } = require('./middlewares');

const hideMenu = async(ctx, next) => {
    const msg = await ctx.reply('hide menu', Markup.removeKeyboard());
    await ctx.deleteMessage(msg.message_id);
    return next();
};

const formatRideReply = (ride) => {
    const date = ride.departureTime.toISOString().slice(0, 10);

    let from;
    if (ride.from.city) {
        from = ride.from.city;
    } else {
        from = ride.from.country;
    }
    let status;
    if (ride.status == 'FINISHED') {
        status = '\n<b>Поїздку завершено</b>';
    } else {
        status = '';
    }

    return `Дата: ${date}\nЗвідки: ${from}\nКуди: ${ride.destination.city}` + status;
};

const registerMenuHandlers = (bot, newRideScene) => {
    bot.hears(
        'Мій профіль',
        driverComposerOptional(true, async (ctx) => {
            await ctx.reply(`Ім'я: ${ctx.state.driver.name}`);
            await ctx.reply(`Телефон: ${ctx.state.driver.phone}`);
        })
    );

    bot.hears(
        'Зареєструвати поїздку',
        nonFinishedRidesComposerOptional(
            false,
            driverComposerOptional(
                true,
                hideMenu,
                ctx => ctx.scene.enter(newRideScene.id)
            )
        )
    );

    bot.hears(
        'Історія поїздок',
        async (ctx) => {
            if (ctx.state.hasOwnProperty('rides') && ctx.state.rides.length > 0) {
                for (ride of ctx.state.rides) {
                    await ctx.replyWithHTML(formatRideReply(ride));
                }
            } else {
                await ctx.reply('Наразі у вас ще не було зареєстрованих поїздок');
            }
        }
    );

    bot.hears(
        'Переглянути поточну поїздку',
        nonFinishedRidesComposerOptional(true, async(ctx) => {
            for (ride of ctx.state.rides) {
                if (ride.status != 'FINISHED') {
                    await ctx.replyWithHTML(formatRideReply(ride));
                }
            }
        })
    )
};

const menuMarkupWithoutRide = Markup.keyboard([
    ['Зареєструвати поїздку'],
    ['Мій профіль', 'Історія поїздок']
]).resize();

const menuMarkupWithRide = Markup.keyboard([
    ['Переглянути поточну поїздку'],
    ['Мій профіль', 'Історія поїздок']
]).resize();

const showMenu = async (ctx) => {
    let menu;
    if (isNonFinisehdRides(ctx)) {
        menu = menuMarkupWithRide;
    } else {
        menu = menuMarkupWithoutRide;
    }

    await ctx.reply('Оберіть дію', menu);
};

module.exports = {
    showMenu,
    registerMenuHandlers
};
