class APIFeatures {
    constructor(queryDB, queryString) {
        this.queryDB = queryDB;
        this.queryString = queryString;
    }

    filter() {
        // 1) Filtering
        const queryObj = { ...this.queryString };
        // console.log(queryObj);

        const excludedFiels = ['page', 'sort', 'limit', 'fields'];
        excludedFiels.forEach(field => delete queryObj[field]);

        // 2) Advanced filtering
        let queryString = JSON.stringify(queryObj);
        // The second argument accepts a callback string which is the found value
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.queryDB = this.queryDB.find(JSON.parse(queryString));

        return this;
    }

    sort() {
        // 3) Sorting
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.replace(/,/g, ' ');
            // console.log(sortBy);
            this.queryDB = this.queryDB.sort(sortBy);
            // sort('price ratingsAverage')
        } else {
            this.queryDB = this.queryDB.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        // 4) Field limiting
        if (this.queryString.fields) {
            const fields = this.queryString.fields.replace(/,/g, ' ');
            this.queryDB = this.queryDB.select(fields);
            // console.log(fields);
        } else {
            // - meands excluding
            this.queryDB = this.queryDB.select('-__v');
        }

        return this;
    }

    paginate() {
        // 5) Pagination
        // Example: /api/v1/tours?page=2&limit=10: 1-10, page 1. 10-20, page 2
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 100;

        const documentsToSkip = (page - 1) * limit;
        this.queryDB = this.queryDB.skip(documentsToSkip).limit(limit);

        return this;
    }
};

module.exports = APIFeatures;