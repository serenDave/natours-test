const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION:');
    console.log(err.name, err.message);

    process.exit(1);
});

// This command will read our config variables and set them to env variables
dotenv.config({ path: './config.env' });

// Connection our application to the database
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connection established successfully'));

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
    console.log(`App is running on port: ${port}...`);
});

process.on('unhandledRejection', err => {
    console.log('UNCAUGHT REJECTION:');
    console.log(err.name, err.message);

    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully.');
    server.close(() => {
        console.log('Process terminated!');
    });
});