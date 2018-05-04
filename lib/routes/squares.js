const router = require('express').Router();
const Square = require('../models/Square');

module.exports = router
    .post('/', (req, res, next) => {
        Square.create(req.body)
            .then(square => res.json(square))
            .catch(next);
    });