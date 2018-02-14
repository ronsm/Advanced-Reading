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

// Example of valid JSON
// { "objectType":"beacon_rssi", "beacons_in_range":5 }

/* 
 * DB Manipulation Functions  
 * ----------------------------------------------------------------------------------------------------
 */

function retrieveFromDBTest(data){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
            db.collection("Beacon_RSSI_Readings").find().toArray(function(err, docs) {
                console.log(JSON.stringify(docs));
                db.close();
            });
    });

}