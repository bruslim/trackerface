/*jshint node: true*/

'use strict';

var events = require('events');
var util = require('util');

var MetaInfo = require('torrentmeta');
var bigint = require('bigint');

var TorrentMonitor = module.exports = function TorrentMonitor(metaInfo) {
  events.EventEmitter.call(this);
  
  if (!(metaInfo instanceof MetaInfo)) {
    throw new TypeError('metaInfo must be an instance of MetaInfo');
  }
  Object.defineProperties(this,{
    leechers: {
      enumerable: true,
      get: function() {
        Object.keys(this.stats).reduce(function(previous, current){
          return previous + current.leechers;
        }, 0);
      }
    },
    seeders: {
      enumerable: true,
      get: function() {
        Object.keys(this.stats).reduce(function(previous, current){
          return previous + current.seeders;
        }, 0);
      }
    },
    stats: {
      value: {},
      enumerable: true
    },
    addedOn: {
      value: new Date(),
      writable: true,
      enumerable: true
    },
    isStarted: {
      value: false,
      writable: true,
      enumerable: true
    },
    isCompleted: {
      enumerable: true,
      get: function() {
        return this.numWant === 0;
      }
    },
    _infoHash: {
      value: metaInfo.infoHash
    },
    infoHash: {
      enumerable: true,
      get: function() {
        return this._infoHash.toString('base64');
      }
    },
    _downloaded: {
      value: new Buffer([0,0,0,0,0,0,0,0])
    },
    downloaded: {
      enumerable: true,
      get: function() {
        return bigint.fromBuffer(this._downloaded);
      },
      set: function(value) {
        if (Buffer.isBuffer(value)) {
          value.copy(this._downloaded);
          return;
        }
        if (value instanceof bigint) {
          value.toBuffer().copy(this._downloaded);
        }
        bigint(value).toBuffer().copy(this._downloaded);
      }
    },
    _left: {
      value: new Buffer([0,0,0,0,0,0,0,0])
    },
    left: {
      enumerable: true,
      get: function() {
        return bigint.fromBuffer(this._left);
      },
      set: function(value) {
        if (Buffer.isBuffer(value)) {
          value.copy(this._left);
          return;
        }
        if (value instanceof bigint) {
          value.toBuffer().copy(this._left);
        }
        bigint(value).toBuffer().copy(this._left);
      }
    },
    _uploaded: {
      value: new Buffer([0,0,0,0,0,0,0,0])
    },
    uploaded: {
      enumerable: true,
      get: function() {
        return bigint.fromBuffer(this._uploaded);
      },
      set: function(value) {
        if (Buffer.isBuffer(value)) {
          value.copy(this._uploaded);
          return;
        }
        if (value instanceof bigint) {
          value.toBuffer().copy(this._uploaded);
        }
        bigint(value).toBuffer().copy(this._uploaded);
      }
    },
    _key: {
      value: new Buffer([0,0,0,0])
    },
    _numWant: {
      get: function() {
        var b = new Buffer(4);
        b.writeInt32BE(this.numWant,0);
        return b;
      }
    },
    numWant: {
      value: 50,
      writable: true,
      enumerable: true
    },
    piecesCount: {
      value: metaInfo.pieces.length,
      enumerable: true
    },
    piecesDownloaded: {
      value: 0,
      writable: true,
      enumerable: true
    },
    peers: {
      enumerable: true,
      get: function() {
        var peers = {};
        Object.keys(this.stats).forEach(function(tracker){
          Object.keys(this.stats[tracker].peers).forEach(function(peer){
            peers[peer] = this.stats[tracker].peers[peer];
          },this);
        },this);
        Object.freeze(peers);
        return peers;
      }
    }
  });
};

util.inherits(TorrentMonitor, events.EventEmitter);




