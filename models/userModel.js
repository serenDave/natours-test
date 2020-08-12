const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User must have a name'],
        minlength: [4, 'User name must be at least 4 characters'],
        maxlength: [20, 'User name must be below 20 characters']
    },
    email: {
        type: String,
        required: [true, 'User must have an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Email must be valid']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'User must have a password'],
        minlength: [8, 'User password must be at least 8 characters length'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'User must have a confirmed password'],
        validate: {
            // this works only for SAVE
            validator: function(value) {
                return value === this.password;
            },
            message: 'Passwords should coincide with each other'
        }
    },
    passwordChangedAt: {
        type: Date,
        select: false
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {
    // we want to encrypt the password only if it was modified
    if (!this.isModified('password')) return next();

    // We'll be using bcrypt as a decryption algorithm
    // Second paramater defines how CPU intensive the decryption will be,
    // and the more intensive, the better password will be decrypted
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;

    next();
});

userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/g, function(next) {
    // "this" points to the current query
    this.find({ active: { $ne: false } });
    next();
});

// creating instance methods (methods that will be availabe on 
// every document of this model)
userSchema.methods.checkPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimeStamp < changedTimeStamp;
    }

    // False means paswword was NOT changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    // 1) Create our token, that we will sent to the user
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2) Decrypt our token and store it in the DB
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // 3) Specify the expiration date of the token (10 mins)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;