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
var io = require('socket.io')(http);

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

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

/* 
 * Socket.io
 * ----------------------------------------------------------------------------------------------------
 */


io.on('connection', function(socket){
    console.log('a user connected');
});

io.on('connection', function(socket){
    socket.on('new data', function(msg){
        console.log(JSON.stringify(msg, null, '  '));
        addBeaconRSSIReadingToDB(msg);
    });
});

/* 
 * DB Manipulation Functions  
 * ----------------------------------------------------------------------------------------------------
 */

function addBeaconRSSIReadingToDB(data){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        db.collection("Beacon_RSSI_Readings_3").insert(data, function(err, res) {
            if (err) throw err;
            console.log("Added 1 object to Beacon_RSSI_Readings_3 collection.");
            db.close();
        });
    });

}

function retrieveFromDBTest(data){

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        db.collection("Beacon_RSSI_Readings_2").find().toArray(function(err, docs) {
            console.log(JSON.stringify(docs));
            db.close();
        });
    });

}