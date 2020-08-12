const APIFeatures = require('../utils/apiFeatures');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// That idea of the factory function is that it builds other functions
// that are suitable for specific needs / endpoints

exports.getAll = Model => {
    return catchAsync(async (req, res, next) => {
        // To allow for nested GET reviews on tour
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        // const docs = await features.queryDB.explain();
        const docs = await features.queryDB;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: docs.length,
            data: { docs },
        });
    });
};

exports.getOne = (Model, populateOptions) => {
    return catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (populateOptions) query = query.populate(populateOptions);

        const doc = await query;

        if (!doc) {
            return next(new AppError('No doc found with that id', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { doc },
        });
    });
};


exports.createOne = Model => {
    return catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            message: 'New doc successfully added',
            data: { doc },
        });
    });
};

exports.updateOne = Model => {
    return catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!doc) {
            return next(new AppError('No document found with that id', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { doc },
        });
    });
};

exports.deleteOne = Model => {
    return catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with that id', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });
};