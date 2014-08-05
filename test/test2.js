/*jshint node: true */
'use strict';


var Trackerface = require('../index.js');

var TorrentMeta = require('torrentmeta');



var fs = require('fs');

var path = require('path');


var raw = fs.readFileSync(path.join(__dirname,'multifile.torrent'));

var torrent = TorrentMeta.parse(raw);


var trackerface = new Trackerface(6881);

var monitor = trackerface.createMonitor(torrent);

monitor.on('connected', function(response) {
  console.log('===CONNECTED===');
  console.log(trackerface.connections[response.connectionId].key, response.connectionId);
  console.log('===============');
});
monitor.on('updated', function(o) {
  console.log('===UPDATED===');
  console.log(JSON.stringify(o, null, 2));
  //console.log(JSON.stringify(monitor, null, 2));
  console.log('=============');
});

monitor.on('error', function(err) {
  console.log('===MERROR===');
  console.log(err);
  console.log('============');
});

trackerface.on('sent', function(o){
  console.log('===SENT===');
  console.log(JSON.stringify(o, null, 2));
  console.log('==========');
});
trackerface.on('received', function(o){
  console.log('===RECEIVED===');
  console.log(JSON.stringify(o, null, 2));
  console.log('==============');
});

trackerface.on('error', function(err) {
  console.log('===KERROR===');
  console.log(err);
  console.log('============');
});