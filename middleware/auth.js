const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * This middleware protects routes by verifying the JSON Web Token (JWT)
 * passed in the 'Authorization' header of the incoming request.
 */
const auth = (req, res, next) => {
    try {
        // 1. Get token from header (Format: "Bearer <token>")
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Unauthorized access (no/invalid token format)
            return res.status(401).json({ 
                success: false, 
                message: 'Access Denied: No valid authentication token provided.' 
            });
        }

        // Extract the token string
        const token = authHeader.replace('Bearer ', '');

        // 2. Verify the token using the secret key
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!verified) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access Denied: Token verification failed.' 
            });
        }

        // 3. Attach the user ID from the token payload to the request object
        // This allows subsequent route handlers to know exactly which user is making the request
        req.user = verified.id; 
        
        // 4. Move to the next middleware or route handler
        next();
    } catch (err) {
        // Handle specific JWT errors (e.g., TokenExpiredError)
        res.status(401).json({ 
            success: false, 
            message: 'Access Denied: Token is invalid or has expired.' 
        });
    }
};

module.exports = auth;
