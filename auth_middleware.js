
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'learnpath_enhanced_secret_key_2024';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'Access denied. No token provided.',
            code: 'NO_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        
        const now = Math.floor(Date.now() / 1000);
        const tokenExp = decoded.exp;
        const timeUntilExp = tokenExp - now;
        
        if (timeUntilExp < 3600) {
            res.set('X-Token-Refresh-Needed', 'true');
        }
        
        next();
    } catch (error) {
        let errorResponse = { error: 'Invalid token.' };
        
        if (error.name === 'TokenExpiredError') {
            errorResponse.code = 'TOKEN_EXPIRED';
            errorResponse.error = 'Token has expired. Please log in again.';
            return res.status(401).json(errorResponse);
        } else if (error.name === 'JsonWebTokenError') {
            errorResponse.code = 'INVALID_TOKEN';
            errorResponse.error = 'Invalid token format.';
            return res.status(403).json(errorResponse);
        }
        
        return res.status(403).json(errorResponse);
    }
}

function optionalAuthentication(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
}

function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required.',
            code: 'NO_AUTH'
        });
    }
    
    if (req.user.role !== 'admin') {
        console.log(`Access denied for user ${req.user.userId} (${req.user.email}) attempting admin action`);
        return res.status(403).json({ 
            error: 'Admin access required.',
            code: 'INSUFFICIENT_PRIVILEGES'
        });
    }
    
    console.log(`Admin action: ${req.method} ${req.path} by user ${req.user.userId} (${req.user.email})`);
    next();
}

module.exports = {
    authenticateToken,
    optionalAuthentication,
    requireAdmin,
    JWT_SECRET
};
