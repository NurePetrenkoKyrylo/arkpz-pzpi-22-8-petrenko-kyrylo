const jwt = require('jsonwebtoken');
const {secret} = require("../config");
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log({ message: 'No token provided' });
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            console.log(err);
            return res.status(403).json({ message: 'Invalid token', err });
        }
        req.user = user;
        next();
    });
}

function authorizeRole(allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            console.log({ message: 'Access denied' });
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
}

module.exports = {
    authenticateToken,
    authorizeRole
};