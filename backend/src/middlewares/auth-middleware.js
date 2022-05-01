const { jwtService } = require('../services');
const { userModel } = require('../models');

async function authMiddleware(req, res, next) {
    if (req.path.startsWith('/auth')) return next();

    const token = req.cookies['dh.auth'];
    const tokenPayload = token && await jwtService.decodeOrNull(token);
    const user = tokenPayload && await userModel.findById(tokenPayload.userId).exec();

    if (!user) {
        return res.status(403).send();
    }

    req.user = user;
    next();
}

module.exports = { authMiddleware };
