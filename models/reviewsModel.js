const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must reference a tour']
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must reference a user']
    },
    rating: {
        type: Number,
        required: [true, 'Review must have a rating'],
        min: [1, 'Review rating must be equal or greater than 1'],
        max: [5, 'Review rating must be equal or less than 5']
    },
    review: {
        type: String,
        required: [true, 'Review cannot be empty']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

reviewSchema.index({ tour: 1, author: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'author',
        select: 'name photo'
    });

    next();
});

// Creating a static method on the Mongoose model
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                numRatings: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].numRatings,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

reviewSchema.post('save', function(docs, next) {
    // "this" points to current review
    // points to the model that created current document
    this.constructor.calcAverageRatings(this.tour);
    next(); 
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
    // We create a property on this variable in order to get acces to it in "post" middleware
    this.review = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function() {
    // this.review = await this.findOne(); does not work here, the query has already been executed
    await this.review.constructor.calcAverageRatings(this.review.tour);
});

const Review = mongoose.model('Review', reviewSchema);


module.exports = Review;