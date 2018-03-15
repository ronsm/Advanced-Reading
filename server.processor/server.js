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

    getLatestBeaconReading(true, function(results){
        console.log(results);
        //calculateDistanceZone3(5);
        calculateAllDistances();
    });

}

/* 
 * STEP 1
 * ----------------------------------------------------------------------------------------------------
 */

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

/* 
 * STEP 2
 * ----------------------------------------------------------------------------------------------------
 */

function kalmanFilterReadings(noisyData){
    var kalmanFilter = new KalmanFilter({R: 0.01, Q: 3});
    
    var kalmanData = noisyData.map(function(v) {
        return kalmanFilter.filter(v);
    });

    return kalmanData;
}

/* 
 * STEP 3
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

    if(distance == 0 || distance > 20){
        distance = 20;
    }
    
    return distance;
}

function calculateAllDistances(zone) {

    var rssiVals = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    //console.log(beaconObject.beacons);

    rssiVals[0] = -1 * averageArray(beaconObject.beacons[0]);
    rssiVals[1] = -1 * averageArray(beaconObject.beacons[1]);
    rssiVals[2] = -1 * averageArray(beaconObject.beacons[2]);
    rssiVals[3] = -1 * averageArray(beaconObject.beacons[3]);
    rssiVals[4] = -1 * averageArray(beaconObject.beacons[4]);
    rssiVals[5] = -1 * averageArray(beaconObject.beacons[5]);
    rssiVals[6] = -1 * averageArray(beaconObject.beacons[6]);
    rssiVals[7] = -1 * averageArray(beaconObject.beacons[7]);
    rssiVals[8] = -1 * averageArray(beaconObject.beacons[8]);

    var distVals = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    for(var i = 0; i < 9; i++){
        distVals[i] = calculateDistance(rssiVals[i]);
        console.log('Round: ' + i + ', Values: ' + distVals);
    }

    zoneEstimation(distVals);

}

// DEPRECATED
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

/* 
 * STEP 4
 * ----------------------------------------------------------------------------------------------------
 */

function zoneEstimation(beaconDistances){

    //var beaconDistancesJSON = JSON.stringify(beaconDistances);

    var beaconDistancesObject = [
        { "id" : 0, "zones" : [1], "distance" : beaconDistances[0]},
        { "id" : 1, "zones" : [1], "distance" : beaconDistances[1]},
        { "id" : 2, "zones" : [1, 2], "distance" : beaconDistances[2]},
        { "id" : 3, "zones" : [2], "distance" : beaconDistances[3]},
        { "id" : 4, "zones" : [2], "distance" : beaconDistances[4]},
        { "id" : 5, "zones" : [3], "distance" : beaconDistances[5]},
        { "id" : 6, "zones" : [3], "distance" : beaconDistances[6]},
        { "id" : 7, "zones" : [3], "distance" : beaconDistances[7]},
        { "id" : 8, "zones" : [4], "distance" : beaconDistances[8]},
    ];

    console.log(beaconDistances);
    console.log(beaconDistancesObject);

    //var sortedBeaconDistances = beaconDistancesObject.items.sort(function(a, b) {return a.distances - b.distances});

    var sortedBeaconDistances = beaconDistancesObject.sort(function(a, b) {
        return parseFloat(a.distance) - parseFloat(b.distance);
    });

    var firstGuess = sortedBeaconDistances[0].zones[0];
    var secondGuess = sortedBeaconDistances[1].zones[0];

    var firstGuessCorrect = false;
    for(var i = 0; i < sortedBeaconDistances[0].zones.length; i++){
        for(var j = 0; j < sortedBeaconDistances[1].zones.length; j++){
            if(sortedBeaconDistances[1].zones[j] == firstGuess){
                firstGuessCorrect = true;
            }
        }
        for(var j = 0; j < sortedBeaconDistances[2].zones.length; j++){
            if(sortedBeaconDistances[2].zones[j] == firstGuess){
                firstGuessCorrect = true;
            }
        }
    }

    if(firstGuess){
        nearestZone = firstGuess;
    }

    var secondGuessCorrect = false;
    if(!firstGuess){
        for(var i = 0; i < sortedBeaconDistances[1].zones.length; i++){
            for(var j = 0; j < sortedBeaconDistances[2].zones.length; j++){
                if(sortedBeaconDistances[2].zones[j] == firstGuess){
                    secondGuessCorrect = true;
                }
            }
            for(var j = 0; j < sortedBeaconDistances[3].zones.length; j++){
                if(sortedBeaconDistances[3].zones[j] == firstGuess){
                    secondGuessCorrect = true;
                }
            }
        }
    }

    if(secondGuess){
        nearestZone = secondGuess;
    }

    console.log(sortedBeaconDistances);

    // var c1 = 0;
    // for(var i = 0; i < 3; i++){
    //     if(sortedBeaconDistances[i] < zone1.maxDistance)
    //     c1 = c1++;
    // }

    // var c2 = 0;
    // for(var i = 2; i < 5; i++){
    //     if(sortedBeaconDistances[i] < zone2.maxDistance)
    //     c2 = c2++;
    // }

    // var c3 = 0;
    // for(var i = 5; i < 8; i++){
    //     if(sortedBeaconDistances[i] < zone3.maxDistance)
    //     c3 = c3++;
    // }

    // var nearestZone = -1;

    // if(c1 >= 2){
    //     nearestZone = 1;
    // }

    // if(c2 >= 2){
    //     nearestZone = 2;
    // }

    // if(c3 >= 2){
    //     nearestZone = 3;
    // }

    // if(sortedBeaconDistances[0].minor == 9){
    //     nearestZone = 4;
    // }

    if(nearestZone == 1){
        trilaterateZone3(1, beaconDistances[1], beaconDistances[0], beaconDistances[2]);
        console.log('Zone 1');
    }
    if(nearestZone == 2){
        trilaterateZone3(1, beaconDistances[3], beaconDistances[2], beaconDistances[4]);
        console.log('Zone 2');
    }
    if(nearestZone == 3){
        trilaterateZone3(1, beaconDistances[6], beaconDistances[5], beaconDistances[7]);
        console.log('Zone 3');
    }
    if(nearestZone == 4){
        console.log('Zone 4');
    }
    if(nearestZone == 5){
        console.log('Zone 5');
    }

}

/* 
 * STEP 5
 * ----------------------------------------------------------------------------------------------------
 */

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

/* 
 * STEP 6
 * ----------------------------------------------------------------------------------------------------
 */

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

/* 
 * STEP 7
 * ----------------------------------------------------------------------------------------------------
 */

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
 * Assistive Functions
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

function averageArray(arr){

    var averageVal = 0;

    var sum = 0;
    for(var i = 0; i < 10; i++){
        sum = sum + Math.abs(arr[i]);
    }

    averageVal = sum / 10;

    return averageVal;

}