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
    var latestReading = getLatestBeaconReading();
    console.log(latestReading);
}

/* 
 * DB Manipulation Functions  
 * ----------------------------------------------------------------------------------------------------
 */

function getAllBeaconReadings(){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        db.collection("Beacon_RSSI_Readings").find().toArray(function(err, docs) {
            console.log(JSON.stringify(docs));
            db.close();
        });
    });

}

function getLatestBeaconReading(){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        var latestReading = db.collection("Beacon_RSSI_Readings").find().limit(1).sort({$natural:-1});

        latestReading.toArray(function(err, results) {
            if (err) throw err;
            console.log('%j', results);
            db.close();
            return results;
        });
    });

}

/* 
 * Calculation Functions
 * ----------------------------------------------------------------------------------------------------
 */

function calculateDistance(rssi) {
    var txPower = -59;

    if (rssi == 0){
        return -1.0;
    }

    var ratio = (rssi * 1.0) / txPower;

    if (ratio < 1.0){
        return Math.pow(ratio, 10);
    }
    else{
        var distance =  ((0.89976) * Math.pow(ratio, 7.7095)) + 0.111;
        return distance;
    }
} 