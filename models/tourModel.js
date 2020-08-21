const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        // validators
        maxlength: [40, 'A tour name must contain less or equal than 40 characters'],
        minlength: [10, 'A tour name must contain more or equal than 10 characters'],
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty can be either easy, medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        // will run each time new value is set to this field
        set: value => Math.round(value * 10) / 10  
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
        type: Number,
        // our own validation function
        validate: {
            validator: function(value) {
                // IMPORTANT: "this" points to current doc only while CREATING the document 
                // not while UPDATING
                return value < this.price;
            },
            message: 'Discount price ({VALUE}) should be below the regular price'
        }
    },
    summary: {
        type: String,
        required: [true, 'A tour must have a description'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Simply will be the name of the image, which we'll read from the file system
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    // Will be an array of Strings
    images: [String],
    // Will be converted to current date
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false,
        select: false
    },
    // GeoJSON
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    // By specifying an array of documents we say it will have multiple values
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        // That's how we establish references between different data sets in Mongoose
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 1 - asc, -1 - desc
// single field index
// tourSchema.index({ price: 1 });
// compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

/**
 * Virtual properties are the props that won't we saved to database
 * Will be created each time we get the data from the DB
 * However, we cannot specify them in the query, cause
 * they are not the part of the db 
*/

/** 
* We need a regular function here, because arrow function 
* shares the "this" keyword with the surroundings
* while regular functions puts "this" where it was called
*/
tourSchema.virtual('durationWeeks').get(function() {
    return Math.ceil(this.duration / 7);
});

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    // how tour is called in review model
    foreignField: 'tour',
    // how tour is called in this schema
    localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() events
tourSchema.pre('save', function(next) {
    // In a safe middleare "this" keyword is gonna point 
    // to the currently processed document

    this.slug = slugify(this.name, { lower: true });
    next();
});

// How embedding works
// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
    
//     next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next(); 
});

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next();
});

// "This" still points to processed query
// tourSchema.post(/^find/, function(docs, next) {
//     console.log(`Query took: ${Date.now() - this.start} milliseconds`);
//     next();
// });

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//     this._pipeline.unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });

// It's a convention to always use model Names with uppercase
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;