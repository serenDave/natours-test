// EXPRESS
const express = require('express');

// NECESSARY MIDDLEWARE
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

// ERROR HANDLERS
const AppError = require('./utils/appError');
const errorHandler = require('./controllers/errorController');

// ROUTERS
const toursRouter = require('./routes/tourRoutes');
const usersRouter = require('./routes/userRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const bookingController = require('./controllers/bookingController');

// Start new app
const app = express();

app.enable('trust proxy');

// Telling Express what templating engine we'll be using 
app.set('view engine', 'pug');

// With path.join() Node will automatically create the right path
app.set('views', path.join(__dirname, 'views'));

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// GLOBAL MIDDLEWARES

// Implement CORS
app.use(cors());

// app.use(cors({ origin: 'https://www.natours.com' }));

// OPTIONS HTTP method (needed for "complex" requests like PATCH or DELETE)
app.options('*', cors());

// Set security HTTP headers
app.use(helmet());

// Development loging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit request from the same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from the same IP per amount of time. Please, try again in 1 hour.'
});
app.use('/api', limiter);

// A route for stripe webhook 
// (is here because we need the body coming from the request not in JSON)
app.post('/webhook-checkout', express.raw({ type: 'application/json' }), bookingController.webhookCheckout);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression());

// Data sanitization against NoSQL query injection 
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
    whitelist: [
        'duration', 
        'ratingsQuantity', 
        'ratingsAverage', 
        'maxGroupSize', 
        'difficulty', 
        'price'
    ]
}));

// Custom middleware
// app.use((req, res, next) => {
//     console.log(req.cookies);
//     next();
// });

// Route middlewares for special end points
app.use('/', viewRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingRouter);

// Error catching middleware
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

// By specifying 4 parameters express already knows 
// this that this function if an error handling middleware
app.use(errorHandler);

module.exports = app;
