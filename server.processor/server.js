/* 
 * server.receiver -> server.js
 * ----------------------------------------------------------------------------------------------------
 * 
 * Author: Ronnie Smith <ras35@hw.ac.uk>
 * Version: 1.0
 * Date: 14th February 2018
 * 
 */

/* 
 * Defintions and Global Variables
 * ----------------------------------------------------------------------------------------------------
 */

// Packages
var app = require('express')();
var http = require('http').Server(app);

var KalmanFilter = require('kalmanjs').default;
var kf = new KalmanFilter();
kf.filter(2);

// MongoDB
var dbName = "AR";
var mongo = require('mongodb');
var mongoClient = require('mongodb').MongoClient;
var db = require('mongodb').Db;
var con_url = "mongodb://localhost:27017/" + dbName;

/* 
 * JSON
 * ----------------------------------------------------------------------------------------------------
 */

const zone1 = {
    "_id" : ObjectId("5a954f24ed0b1064d1cc513b"),
    "zone" : 1,
    "zoneName" : "kitchen",
    "x" : 3.825,
    "y" : 4.213,
    "maxDistance" : 5.69,
    "beaconPos" : [ 
        true, 
        true, 
        true, 
        false
    ],
    "beaconMajor" : 1,
    "beaconMinors" : [ 
        1, 
        2, 
        3
    ]
}

const zone2 = {
    "_id" : ObjectId("5a954f69ed0b1064d1cc514d"),
    "zone" : 2,
    "zoneName" : "lounge",
    "x" : 3.825,
    "y" : 3.787,
    "maxDistance" : 5.38,
    "beaconPos" : [ 
        false, 
        true, 
        true, 
        true
    ],
    "beaconMajor" : 1,
    "beaconMinors" : [ 
        3, 
        4, 
        5
    ]
}

const zone3 = {
    "_id" : ObjectId("5a954f81ed0b1064d1cc5157"),
    "zone" : 3,
    "zoneName" : "bedroom",
    "x" : 3.139,
    "y" : 3.787,
    "maxDistance" : 4.92,
    "beaconPos" : [ 
        true, 
        false, 
        true, 
        true
    ],
    "beaconMajor" : 1,
    "beaconMinors" : [ 
        6, 
        7, 
        8
    ]
}

const zone4 = {
    "_id" : ObjectId("5a954f9eed0b1064d1cc515e"),
    "zone" : 4,
    "zoneName" : "bathroom",
    "x" : 3.139,
    "y" : 2.77,
    "maxDistance" : 4.19,
    "beaconPos" : [ 
        true, 
        false, 
        false, 
        false
    ],
    "beaconMajor" : 1,
    "beaconMinors" : [ 
        9
    ]
}

/* 
 * Main Function
 * ----------------------------------------------------------------------------------------------------
 */

runProcessor();

function runProcessor(){}
setInterval(processor, 1000);

function processor(){
    //var latestReading = getEstimatedDistanceFromBeacon(1, true);
    //console.log(latestReading);

    calculateDistanceZone3(1);
}

/* 
 * DB Manipulation Functions  
 * ----------------------------------------------------------------------------------------------------
 */

function getAllBeaconReadings(){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        db.collection("Beacon_RSSI_Readings_2").find().toArray(function(err, docs) {
            console.log(JSON.stringify(docs));
            db.close();
        });
    });

}

function getEstimatedDistanceFromBeacon(beaconId, filter){

    getLatestBeaconReading(filter, function(results) {
        var averageRssi = 0;

        var sum = 0;
        for(var i = 0; i < 10; i++){
            sum = sum + Math.abs(results[i]);
        }

        averageRssi = sum / 10;
    
        console.log(averageRssi);

        //var dist = calculateDistance(-60);
        var dist = calculateDistance(averageRssi);

        console.log('Distance: ' + dist);

    });

}

function getLatestBeaconReading(filter, callback){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        //var latestReading = db.collection("Beacon_RSSI_Readings_2").find().limit(10).sort({$natural:-1});

        var latestReadings = db.collection("Beacon_RSSI_Readings_2").find({}, { _id: 0, rssi: 1 }).sort({ $natural: -1 }).limit(10);

        latestReadings = latestReadings.toArray(function(err, results) {
            if (err) throw err;
            console.log('%j', results);
            db.close();

            var simpleResults = [];
            for(var i = 0; i < 10; i++){
                simpleResults[i] = results[i].rssi;
            }

            results = simpleResults;

            console.log(results);

            if(filter){
                results = kalmanFilterReadings(results);
            }

            console.log(results);

            callback(results);

        });
    });

}

function kalmanFilterReadings(noisyData){
    var kalmanFilter = new KalmanFilter({R: 0.01, Q: 3});
    
    var kalmanData = noisyData.map(function(v) {
        return kalmanFilter.filter(v);
    });

    return kalmanData;
}

/* 
 * Calculation Functions
 * ----------------------------------------------------------------------------------------------------
 */

// Implementing distance caluclation as per this paper:
// https://www.rn.inf.tu-dresden.de/dargie/papers/icwcuca.pdf
function calculateDistance(rssi) {

    // -55dB measured 1 metre away from Bluno Beetle
    var txPower = -52;
    var N = 2.5;
    var distance = -1.0;

    if (rssi == 0){
        return distance;
    }

    var power = (txPower - rssi) / (10 * N);
    distance = Math.pow(10, power);

    return distance;
}

// Conduct distance calculate for all beacons in zone
function calculateDistanceZone3(zone) {

    var rssiVals = [56, 52, 52];
    var distVals = [0, 0, 0];

    for(var i = 0; i < 3; i++){
        distVals[i] = calculateDistance(rssiVals[i]);
    }

    trilaterateZone3(1, distVals[0], distVals[1], distVals[2])

}

// Implementing trilateration with 3 beacons using basic geometry
function trilaterateZone3(zone, d1, d2, d3){

    u = zone.x;
    v = zone.y;

    numerator_x = Math.pow(u, 2) + (Math.pow(d1, 2) - Math.pow(d2, 2));
    denominator_x = 2 * u;

    x = numerator_x / denominator_x;
    
    numerator_y = Math.pow(v, 2) + (Math.pow(d1, 2) - Math.pow(d3, 2));
    denominator_y = 2 * v;

    y = numerator_y / denominator_y;

    console.log('x: ' + x + ' y: ' + y);

}

function zoneEstimation(beaconDistances){

    var sortedBeaconDistances = beaconDistances.items.sort(function(a, b) {return a.distance - b.distance});

    var c1 = 0;
    for(var i = 0; i < 3; i++){
        if(sortedBeaconDistances[i] < zone1.maxDistance)
        c1 = c1++;
    }

    var c2 = 0;
    for(var i = 2; i < 5; i++){
        if(sortedBeaconDistances[i] < zone2.maxDistance)
        c2 = c2++;
    }

    var c3 = 0;
    for(var i = 5; i < 8; i++){
        if(sortedBeaconDistances[i] < zone3.maxDistance)
        c3 = c3++;
    }

    var nearestZone = -1;

    if(c1 >= 2){
        nearestZone = 1;
    }

    if(c2 >= 2){
        nearestZone = 2;
    }

    if(c3 >= 2){
        nearestZone = 3;
    }

    if(sortedBeaconDistances[0].minor == 9){
        nearestZone = 4;
    }

}