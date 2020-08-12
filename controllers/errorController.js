const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(error => error.message);

    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleTokenExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }

    // RENDERED ERROR PAGE
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message
    });
};

const sendErrorProd = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted error: sending a message to a client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }

        // Programming or other error: don't want to leak the details to a client
        // 1) Log error
        console.error(err);

        // 2) Send a generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong on the server'
        });
    } 

    // RENDERED WEBSITE

    // Operational, trusted error: sending a message to a client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    }
     
    // Programming or other error: don't want to leak the details to a client
    // 1) Log error
    console.error(err.message);

    // 2) Send a generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please, try again later.',
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);       
    } else if (process.env.NODE_ENV === 'production') {
        let error = Object.assign(err);

        switch (true) {
            case error.name === 'CastError':
                error = handleCastErrorDB(error);
                break;
            case error.code === 11000:
                error = handleDuplicateErrorDB(error);
                break;
            case error._message === 'Validation failed':
                error = handleValidationErrorDB(error);
                break;
            case error.name === 'JsonWebTokenError':
                error = handleJWTError();
                break;
            case error.name === 'TokenExpiredError':
                error = handleTokenExpiredError();
                break;
            default:
                break;
        }
        
       sendErrorProd(error, req, res); 
    }
};