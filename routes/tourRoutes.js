const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Mounting a router (re-routing from the tourRouter to reviewRouter)
router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/5-best-tours').get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/monthly-plan/:year').get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
    );

// tours-within/300/center/40,45/unit/meters
router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances); 

router.route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour,
    );

router.route('/:id')
    .get(tourController.getSelectedTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateSelectedTour,
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteSelectedTour,
    );

module.exports = router;
