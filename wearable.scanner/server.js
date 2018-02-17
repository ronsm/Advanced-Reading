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
var socket = io.connect('http://192.168.1.13:3000', {reconnect: true});

var noble = require('noble');
const BeaconScanner = require('node-beacon-scanner');
const scanner = new BeaconScanner();

/* 
 * Beacon Scanner
 * ----------------------------------------------------------------------------------------------------
 */

setInterval(scanControl, 1000);

scanner.onadvertisement = (ad) => {
    //console.log(JSON.stringify(ad, null, '  '));
    socket.emit('new data', ad);
};
  
function scanControl(){
    scanner.startScan();
}

scanner.startScan().then(() => {
    console.log('Scanning...');
}).catch((error) => {
    console.error(error);
});