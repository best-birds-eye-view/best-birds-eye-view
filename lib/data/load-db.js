const connect = require('../util/connect');
const mongoose = require('mongoose');

const squareData = require('./square-data');
const Square = require('../models/Square');
const endpointData = require('./endpoint-data');
const Endpoint = require('../models/Endpoint');
const itemData = require('./item-data');
const Item = require('../models/Item');
const Level = require('../models/Level');

// first, remember to drop collections in Robo 3T

connect('mongodb://localhost:27017/bird-game-test-test') // <- is this the db you want?
    .then(() => {
        return Promise.all([
            Item.create(itemData),
            Endpoint.create(endpointData),
            Square.create(squareData),
        ]);
    })
    .then(() => {
        return Promise.all([
            Item.findOne({ itemName: 'wire' }),
            Endpoint.findOne({ 'endpointStory.resolved': /wire you found/ }),
            Square.findOne({ coords: { x: 0, y: -1 } }),
            Square.findOne({ coords: { x: 1, y: 1 } }),                    
            Item.findOne({ itemName: 'walnut' }),
            Endpoint.findOne({ 'endpointStory.resolved': /your shelled prize/ }),
            Square.findOne({ coords: { x: -1, y: 0 } })
        ]);
    })
    .then(([wire, wireEnd, wireFound, wireResolvedWalnutFound, walnut, walnutEnd, walnutResolved]) => {
        wireEnd.requiredItem = wire._id;
        walnutEnd.requiredItem = walnut._id;

        wireFound.itemHere = wire._id;
        wireResolvedWalnutFound.itemHere = walnut._id;

        wireResolvedWalnutFound.endpointHere = wireEnd._id;
        walnutResolved.endpointHere = walnutEnd._id;
        return Promise.all([
            wireEnd.save(),
            walnutEnd.save(),

            wireFound.save(),
            wireResolvedWalnutFound.save(),
            walnutResolved.save(),
        ]);
    })
    .then(() => {
        return Square.find()
            .select('_id');
    })
    .then(squareIds => {
        const formattedIds = squareIds.map(idObj => {
            return { squareId: idObj._id };
        });
        return Level.create({ levelNum: 1, squares: formattedIds });
    })
    .then(() => mongoose.connection.close());
    

