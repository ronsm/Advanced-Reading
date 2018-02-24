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
 * Main Function
 * ----------------------------------------------------------------------------------------------------
 */

runProcessor();

function runProcessor(){}
setInterval(processor, 1000);

function processor(){
    var latestReading = getEstimatedDistanceFromBeacon(1, true);
    //console.log(latestReading);
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

        //var dist = calculateDistance(-40);
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

function calculateDistance(rssi) {

    // Implementing distance caluclation as per this paper:
    // https://www.rn.inf.tu-dresden.de/dargie/papers/icwcuca.pdf

    var txPower = -59;
    var N = 2.5;
    var distance = -1.0;

    if (rssi == 0){
        return distance;
    }

    var power = (txPower - rssi) / (10 * N);
    distance = Math.pow(10, power);

    return distance;
} 