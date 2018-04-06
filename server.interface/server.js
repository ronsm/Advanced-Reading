/* 
 * server.database -> server.js
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
var express = require('express');
var path = require('path');
const router = express.Router()

// MongoDB
var dbName = "AR";
var mongo = require('mongodb');
var mongoClient = require('mongodb').MongoClient;
var db = require('mongodb').Db;
var con_url = "mongodb://localhost:27017/" + dbName;

/* 
 * Express
 * ----------------------------------------------------------------------------------------------------
 */

var app = express();
var http = require('http').Server(app);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var IPSController = require('./routes/ips');
app.use('/ips', IPSController);

http.listen(3001, function(){
  console.log('listening on *:3001');
});

module.exports = app;

/* 
 * DB Manipulation Functions  
 * ----------------------------------------------------------------------------------------------------
 */

function addBeaconRSSIReadingToDB(data){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        db.collection("Beacon_RSSI_Readings").insert(data, function(err, res) {
            if (err) throw err;
            console.log("Added 1 object to Beacon_RSSI_Readings collection.");
            db.close();
        });
    });

}

function retrieveFromDBTest(data){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        db.collection("Beacon_RSSI_Readings").find().toArray(function(err, docs) {
            console.log(JSON.stringify(docs));
            db.close();
        });
    });

}