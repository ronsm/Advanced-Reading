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

// Beacon Data Temp Storage
const numBeacons = 9;

/* 
 * JSON
 * ----------------------------------------------------------------------------------------------------
 */

const beaconObject = {
    "beacons" : []
}

const zone1 = {
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

const zone5 = {
    "zone" : 4,
    "zoneName" : "bathroom",
    "x" : 1.80,
    "y" : 1.76,
    "maxDistance" : 2.51,
    "beaconPos" : [ 
        true, 
        false, 
        true, 
        true
    ],
    "beaconMajor" : 1,
    "beaconMinors" : [ 
        1,
        2,
        3
    ]
}

const positionStore = {
    "x" : 6.964,
    "y" : 8.0,
    "timestamp" : 0
}

const globalX = 0.0;
const globalY = 0.0;

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

    getLatestBeaconReading(true, function(results){
        console.log(results);
        calculateDistanceZone3(5);
    });

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

function getLatestBeaconReading(filter, callback){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        //var latestReading = db.collection("Beacon_RSSI_Readings_2").find().limit(10).sort({$natural:-1});

        var latestReadings = db.collection("Beacon_RSSI_Readings_3").find({}).sort({ $natural: -1 }).limit(10);

        latestReadings = latestReadings.toArray(function(err, results) {
            if (err) throw err;
            //console.log(JSON.stringify(results, null, '  '));
            db.close();

            for(var i = 0; i < numBeacons; i++){
                var simpleResults = [];
                for(var j = 0; j < 10; j++){
                    simpleResults[j] = results[j].beacons[i].rssi;
                }
                beaconObject.beacons[i] = simpleResults;
            }

            if(filter){
                for(var i = 0; i < numBeacons; i++){
                    beaconObject.beacons[i] = kalmanFilterReadings(beaconObject.beacons[i]);
                }
                //results = kalmanFilterReadings(results);
            }

            results = beaconObject;

            //console.log(results);

            callback(results);

        });
    });

}

function addPositionToDB(data){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        db.collection("Beacon_Estimated_Positions").insert(data, function(err, res) {
            if (err) throw err;
            console.log("Added 1 object to Beacon_Estimated_Positions collection.");
            db.close();
        });
    });

}

/* 
 * Calculation Functions
 * ----------------------------------------------------------------------------------------------------
 */

// Implementing distance caluclation as per this paper:
// https://www.rn.inf.tu-dresden.de/dargie/papers/icwcuca.pdf
function calculateDistance(rssi) {

    // txPower measured 1 metre away from Bluno Beetle
    // Values by sampling device:
    // iPhone X:    -54
    // Pi Zero W:   -57
    var txPower = -57;
    var N = 2.0;
    var distance = -1.0;

    if (rssi == 0){
        return distance;
    }

    var power = (txPower - rssi) / (10 * N);
    //distance = Math.pow(10, power);

    // d = d0 * exp(power)
    // As d0 = 1m and we are measuring in metres, the multiplier is excluded
    distance = Math.exp(power);
    
    return distance;
}

function kalmanFilterReadings(noisyData){
    var kalmanFilter = new KalmanFilter({R: 0.01, Q: 3});
    
    var kalmanData = noisyData.map(function(v) {
        return kalmanFilter.filter(v);
    });

    return kalmanData;
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

        var dist = calculateDistance(averageRssi);

        console.log('Distance: ' + dist);

    });

}

function averageArray(arr){

    var averageVal = 0;

    var sum = 0;
    for(var i = 0; i < 10; i++){
        sum = sum + Math.abs(arr[i]);
    }

    averageVal = sum / 10;

    return averageVal;

}

// Conduct distance calculation for all beacons in zone
function calculateDistanceZone3(zone) {

    var rssiVals = [0, 0, 0];
    if(zone == 5){
        rssiVals[0] = -1 * averageArray(beaconObject.beacons[1]);
        rssiVals[1] = -1 * averageArray(beaconObject.beacons[2]);
        rssiVals[2] = -1 * averageArray(beaconObject.beacons[3]);
        console.log('Average values: ' + rssiVals[0] + ', ' + rssiVals[1] + ', ' + rssiVals[2])
    }

    var distVals = [0, 0, 0];

    for(var i = 0; i < 3; i++){
        distVals[i] = calculateDistance(rssiVals[i]);
        console.log('Round: ' + i + ', Values: ' + distVals);
    }

    trilaterateZone3(zone5, distVals[0], distVals[1], distVals[2])

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

function localToGlobalSpace(zone, localPosition) {

    var globalPosition = positionStore;

    if(zone == 1){
        globalPosition.x = globalX - localPosition.x;
        globalPosition.y = globalY - localPosition.y;
    }
    if(zone == 2){
        globalPosition.x = globalX - localPosition.y;
        globalPosition.y = localPosition.x;
    }
    if(zone == 3){
        globalPosition.x = localPosition.x;
        globalPosition.y = localPosition.y;
    }
    if(zone == 4){
        // Centre of the room
        globalPosition.x = 0.5 * zone4.x;
        globalPosition.y = 0.5 * zone4.y;
    }

    globalPosition.timestamp = Date.now();

    addPositionToDB(globalPosition);

    return globalPosition;

}