module.exports = fn => {
    return (req, res, next) => {
        // catch(next) is the same as catch(err => next(err))
        fn(req, res, next).catch(next);
    };
};