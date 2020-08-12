const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build a template
    // 3) Render the template using tour data from step 1
    res.status(200).render('overview', {
        title: 'All tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // 1) Get the data from the requested tour (including reviews and tour guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name!', 404));
    }

    // 2) Fill in the fields 
    // 3) Display the tour
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});

exports.getLoginPage = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'My cabinet'
    });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });

    // 2) Find tours with the specified returned IDs
    const tourIds = bookings.map(booking => booking.tour);
    const tours = await Tour.find({ _id: { $in: tourIds }});

    // 3) Send the response
    res.status(200).render('overview', {
        title: 'My tours',
        tours
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    // NOTE: for updating the password it's better to always have a separate route
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    }, {
        new: true,
        runValidators: true
    });

    res.status(200).render('account', {
        title: 'My cabinet',
        user: updatedUser
    });
});