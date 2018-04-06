/* 
 * wearable.scanner -> server.js
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
var io = require('socket.io-client');
//var socket = io.connect('http://192.168.1.13:3000', {reconnect: true});
var socket = io.connect('http://172.20.10.2:3000', {reconnect: true});
//var socket = io.connect('http://localhost:3000', {reconnect: true});

var noble = require('noble');
const BeaconScanner = require('node-beacon-scanner');
const scanner = new BeaconScanner();

// Beacon Data Temp Storage
const numBeacons = 9;

// Blank iBeacon JSON Objects
const beaconObject = {
    "beacons" : []
}

var beaconObjectOld = {
    "beacons" : []
}

const blankBeacon = {
    "id": "000000000000",
    "address": "00:00:00:00:00:00",
    "localName": "Bluno\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
    "txPowerLevel": null,
    "rssi": -1000,
    "beaconType": "iBeacon",
    "iBeacon": {
      "uuid": "E2C56DB5-DFFB-48D2-B060-D0F5A71096E0",
      "major": 0,
      "minor": 0,
      "txPower": 4
    },
    "timestamp": 0
}

/* 
 * Beacon Scanner
 * ----------------------------------------------------------------------------------------------------
 */

function initBeaconArray(){
    var i;
    for(i = 0; i < 9; i++){
        beaconObject.beacons[i] = blankBeacon;
    }
}

initBeaconArray();

setInterval(scanControl, 10);
setInterval(broadcastControl, 25);
setInterval(clearBeacon, 5000);
  
function scanControl(){
    scanner.startScan();
    scanner.onadvertisement = (ad) => {
        //console.log(JSON.stringify(ad, null, '  '));
        ad.timestamp = Date.now();
        var pos = ad.iBeacon.minor;
        if(pos >= 0 && pos <= 9){
            beaconObject.beacons[pos] = ad;
        }
        //scanner.stopScan();
    };
}

scanner.startScan().then(() => {
    console.log('Scanning...');
}).catch((error) => {
    console.error(error);
});

function broadcastControl(){
    //console.log(beaconObject);
    console.log('Transmitted beacon array.');
    socket.emit('new data', beaconObject);
}

// If a beacon goes offline, clear old value after 5 seconds
function clearBeacon(){
    beaconObjectOld = beaconObject;
    for(var i = 0; i < 9; i++){
        if(beaconObject.beacons[i].timestamp == beaconObjectOld.beacons[i].timestamp){
            beaconObject.beacons[i].iBeacon.rssi = -1000;
        }
    }
}