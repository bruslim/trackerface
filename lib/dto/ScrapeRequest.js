/*jshint node: true */

'use strict';

var util = require('util');
var bigint = require('bigint');
var ip = require('ip');

var Action = require('../UdpAction.js');

var ConnectRequest = require('./ConnectRequest');

var ScrapeRequest = module.exports = function ScrapeRequest(client) {
  ConnectRequest.call(this, client);
  
  Object.defineProperties(this,{
    _torrents: {
      value: {}
    },
    _infoHashes: {
      get: function() {
        return Buffer.concat(this.infoHashes);
      }
    },
    infoHashes: {
      get: function() {
        var hashes = [];
        var keys = Object.keys(this._torrents).sort();
        keys.forEach(function(key){
          hashes.push(this._torrents[key]);
        },this);
        return hashes;
      }
    }
  });
  if (client) {
    // add the info hashes
    Object.keys(client.torrents).sort().forEach(function(base64) {
      this.addInfoHash(client.torrents[base64].infoHash);
    },this);
  }
};

util.inherits(ScrapeRequest, ConnectRequest);

Object.defineProperties(ScrapeRequest.prototype,{
  _keys: {
    value: ConnectRequest.prototype._keys.concat([
      '_infoHashes'
    ])
  },
  _action: {
    value: Action.Buffered.SCRAPE
  }
});

ScrapeRequest.prototype.addInfoHash = function addInfoHash(hash) {
  var isBuffer, key;
  isBuffer = Buffer.isBuffer(hash);
  key = isBuffer ? hash.toString('base64') : hash;
  hash = isBuffer ? hash : new Buffer(hash,'base64');
  this._torrents[key] = hash;
};