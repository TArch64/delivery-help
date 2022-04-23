const bcrypt = require('bcrypt');
const { userModel } = require('../models');
const { jwtService } = require('./jwt-service');

const { BACKEND_AUTH_EXPIRATION } = process.env;

const authService = {
    async validateCredentials(credentials) {
        if (!credentials.username || !credentials.password) return false;

        const user = await userModel.findOne({ username: credentials.username }).exec()
        const isCredentialsValid = user && await bcrypt.compare(credentials.password, user.password);

        return isCredentialsValid ? user : false;
    },

    generateToken(user) {
        return jwtService.generate({ userId: user.id }, { expiresIn: BACKEND_AUTH_EXPIRATION })
    }
};

module.exports = { authService };
