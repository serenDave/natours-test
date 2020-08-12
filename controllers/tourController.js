const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

// Checking if an uploaded file is actually an image
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image. Please upload only images', 400), false);
    }
};

// Creating middleware for updating images
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

// Passing an array of multiple fields with files (objects)
exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Processing cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 95 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Processing images
    req.body.images = [];

    // NOTE: here it's important TO WAIT until all the images are processed.
    // before calling next() middleware.
    await Promise.all(
        req.files.images.map(async (image, index) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

            await sharp(req.files.images[index].buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 95 })
                .toFile(`public/img/tours/${filename}`);

            req.body.images.push(filename);
        })
    );

    next();
});

exports.getAllTours = factory.getAll(Tour);
exports.getSelectedTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateSelectedTour = factory.updateOne(Tour);
exports.deleteSelectedTour = factory.deleteOne(Tour);

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
    // Passing an array with so called stages.
    // Each document goes through all this stages one by one.
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            // allows to group docs together using accumulators | GROUP BY value
            // Meands GROUP BY id (select all) and calculate avgs, mins and maxs
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            $sort: { avgPrice: 1 },
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: { stats },
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = parseInt(req.params.year, 10);

    const plan = await Tour.aggregate([
        {
            // get the values out of the array and displays each tour with separate value
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' },
            },
        },
        {
            $addFields: { month: '$_id' },
        },
        {
            // _id no longer shows up
            $project: {
                _id: 0,
            },
        },
        {
            $sort: { numTourStarts: -1 },
        },
        {
            $limit: 12,
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: { plan },
    });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    // router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const earthRadiusMi = 3963.2;
    const earthRadiusKm = 6378.1;

    const radius = unit === 'mi' ? distance / earthRadiusMi : distance / earthRadiusKm;

    if (!lat || !lng) {
        return next(new AppError('You should provide latitur and longtitude in the format lat,lng', 400));
    }

    // finds the documents within a certain place
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        },
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        return next(new AppError('You should provide latitur and longtitude in the format lat,lng', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [+lng, +lat],
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier,
            },
        },
        {
            $project: {
                distance: 1,
                name: 1,
            },
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances,
        },
    });
});
