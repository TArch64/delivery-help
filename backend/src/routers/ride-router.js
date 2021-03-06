const { Router } = require('express');
const { Error: MongooseError } = require('mongoose');
const { driverModel, rideModel } = require('../models');
const { broadcastNewRide, broadcastUpdateRide } = require('../socket');
const { getRandomDriver, getRandomRides } = require('../seed');

const rideRouter = Router();

rideRouter.get('/rides', async (req, res) => {
    const rides = await rideModel.find({}).populate('driver');
    res.send({ 'rides': rides });
});

rideRouter.get('/rides/add-random', async (req, res) => {
    const driver = await driverModel.create(getRandomDriver());
    const ride = await rideModel.create({
        driver: driver._id,
        ...getRandomRides()
    });
    await ride.populate('driver');

    broadcastNewRide(ride);
    res.send({ 'status': 'success' });
});

rideRouter.patch('/rides/:id/status', async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    try {
        console.log(id);
        const ride = await rideModel.findById(id);
        if (!ride) {
            return res.status(404).send({ 'message': 'Ride not found' });
        }

        if (!status) {
            return res.status(406).send({ 'message': 'Status not provided' });
        }

        ride.status = status;
        await ride.save();
        await ride.populate('driver');
        broadcastUpdateRide(ride);

        res.send({ 'message': 'Status successfully changed', 'ride': ride });
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return res.status(406).send({ 'message': `${status} is invalid status`, error });
        } else if (error instanceof MongooseError.CastError) {
            return res.status(406).send({ 'message': `${id} is invalid ride id` });
        } else {
            return res.status(500).send({ 'message': 'Something goes wrong!', 'error': error });
        }
    }
});

module.exports = { rideRouter };
