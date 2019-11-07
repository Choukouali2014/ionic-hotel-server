var express = require('express');
var app = express();
var mongoose = require('mongoose');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');

mongoose.connect('mongodb://localhost/hotels');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(cors());

// models
 var Room = mongoose.model('Rooms',{
     room_number: Number,
     type: String,
     beds: Number,
     max_occupancy: Number,
     cost_per_night: Number,
      reserved: [
          {
              from: String,
              to: String
          }
      ]
    });

function getRandomInt(min,max){
    return Math.floor(Math.random() * (max - min)+1) + min;
}
Room.remove({}, function(res){
    console.log("Removed records");
});

Room.count({},function(err, count){
    console.log("Rooms : " + count);
    if(count === 0){
        var recordsToGenerate = 150;

        var roomTypes = [
            'standard',
            'villa',
            'penthouse',
            'studio'
        ];
        for(var i = 0; i<recordsToGenerate; i++){
            var newRoom = new Room({
                room_number: i,
                type: roomTypes[getRandomInt(0,3)],
                beds: getRandomInt(1,6),
                max_occupancy: getRandomInt(1,8),
                cost_per_night: getRandomInt(50,500),
                reserved: [
                    {from: '2019-10-10', to:'2019-10-31' },
                    {from: '2017-04-18', to:'2017-04-23' },
                    {from: '2018-01-29', to:'2018-01-30' }
                ]
            });
            newRoom.save(function(err,doc){
                console.log("Created test document: "+ doc._id)
            });
        }
    }
});
 
app.post('/api/rooms', function(req,res){
    Room.find({
        type: req.body.roomType,
        beds: req.body.beds,
        max_occupancy: {$gt: req.body.guests},
        cost_per_night: {$gte: req.body.priceRange.lower, $lte: req.body.priceRange.upper},
        reserved: {
            $not: {
                $elemMatch: { from: {$lt: req.body.from.substring(0,10)}, to:{$gt: req.body.to.substring(0,10)}}}
            }
        }, function(err, rooms){
            if(err){
                res.send(err);
            } else {
                res.json(rooms);
            }
        });
});

app.post('/api/rooms/reserve', function(req,res){
    console.log(req.body._id);
    Room.findByIdAndUpdate(req.body._id,{
        $push : {"reserved": {from: req.body.from, to: req.body.to}}
    }, {
        safe: true,
        new: true
    },function(err, room){
        if(err){
            res.send(err);
        } else {
            res.json(room);
        }
    });
});

app.listen(8080);
console.log("app listening on port 8080");