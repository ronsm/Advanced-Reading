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
 * Socket.io
 * ----------------------------------------------------------------------------------------------------
 */

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
    socket.on('new data', function(msg){
        console.log('received: ' + msg);
        parsedJSON = JSON.parse(msg);
        objectType = parsedJSON.objectType;

        if(objectType.toString() == "beacon_rssi"){
            console.log(objectType);
            //addBeaconRSSIReadingToDB(parsedJSON);
            retrieveFromDBTest();
        }
        else{
            console.error("Invalid object type!");
        }
    });
});

// Example of valid JSON
// { "objectType":"beacon_rssi", "beacons_in_range":5 }

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