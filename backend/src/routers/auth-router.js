const { Router } = require('express');
const { authService } = require('../services');

const authRouter = Router();

const messages = {
    invalidCredentials: 'Невірно введене імʼя користувача або пароль'
};

const { BACKEND_AUTH_EXPIRATION } = process.env;

authRouter.post('/auth/sign-in', async (req, res) => {
    const user = await authService.validateCredentials({
        username: req.body.username.trim(),
        password: req.body.password.trim()
    });

    if (!user) {
        return res.status(422).json({
            message: messages.invalidCredentials
        });
    }

    const token = await authService.generateToken(user);

    res.cookie('dh.auth', token, {
        maxAge: Number(BACKEND_AUTH_EXPIRATION)
    });

    res.json({ success: true });
});

module.exports = { authRouter };
