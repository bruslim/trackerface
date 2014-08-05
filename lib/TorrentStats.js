/*jshint node: true*/

'use strict';

var events = require('events');
var util = require('util');

var TorrentStats = module.exports = function TorrentStats(bytes) {
  // init peers 
  this.peers = {};
  
  if (arguments.length < 1) { return; }
  switch(bytes.length) {
    case 12: 
      this.seeders = bytes.readInt32BE(0);
      this.completed = bytes.readInt32BE(4);
      this.leechers = bytes.readInt32BE(8);
      break;
    case 8: 
      this.seeders = bytes.readInt32BE(0);
      this.leechers = bytes.readInt32BE(4);
      this.completed = null;
      break;
  }
};

function hasValue(value){
  return value !== undefined && value !== null;
}

TorrentStats.prototype.update = function(stats) {
  if (hasValue(stats.seeders)) {
    this.seeders = stats.seeders;
  }
  if (hasValue(stats.leechers)) {
    this.leechers = stats.leechers;
  } 
  if (hasValue(stats.completed)) {
    this.completed = stats.completed;
  }
};

TorrentStats.prototype.addPeers = function addPeers(peers) {
  if (!Array.isArray(peers)){
    throw new TypeError("peers must be an array");
  }
  
  peers.forEach(function(peer){
    var peerInfo = this.peers[peer];
    if (!peerInfo) {
      peerInfo = (this.peers[peer] = peer);
    }
    peerInfo.lastSeenOn = new Date();
  },this);
};


  