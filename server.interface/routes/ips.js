/* 
 * server.database -> routes -> ips.js
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

// Express
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

// MongoDB
var dbName = "AR";
var mongo = require('mongodb');
var mongoClient = require('mongodb').MongoClient;
var db = require('mongodb').Db;
var con_url = "mongodb://localhost:27017/" + dbName;

router.get('/', function (req, res, next) {
    res.render('index', { title: 'Hello, World!' })
})
  
router.get('/latestPosition', function (req, res, next) {

    mongoClient.connect(con_url, function(err, db){
        if(err) throw err;
        db.collection('Beacon_Estimated_Positions').find().limit(1).sort({$natural:-1}).toArray(function(err, docs) {
            console.log(JSON.stringify(docs));
            db.close();

            if (docs) {
                res.status(200)
                res.json({
                    success: true,
                    message: 'Latest position retrieved.',
                    location: docs
                })
            } else {
                res.status(404)
                res.json({
                    success: false,
                    message: 'Unable to retrieve latest position.'
                })
            }

        });
    });
  })

  module.exports = router