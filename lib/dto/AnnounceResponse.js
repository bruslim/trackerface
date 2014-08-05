/*jshint node: true */

'use strict';

var util = require('util');
var bigint = require('bigint');
var ip = require('ip');

var UdpResponse = require('./UdpResponse');

function Peer(bytes) {
  UdpResponse.enforceLength(bytes, 6);
  Object.defineProperties(this,{
    _ipAddress: {
      value: bytes.slice(0,4)
    },
    ipAddress: {
      enumerable: true,
      get: function() {
        return ip.toString(this._ipAddress);
      }
    },
    _port: {
      value: bytes.slice(4,6)
    },
    port: {
      enumerable: true,
      get: function() {
        return this._port.readUInt16BE(0);
      }
    },
    seenOn: {
      value: new Date(),
      enumerable: true,
    },
    lastSeenOn: {
      writable: true,
      enumerable: true
    },
    staleness: {
      enumerable: true,
      get: function() {
        if (this.lastSeenOn) {
          return Date.now() - this.lastSeenOn.getTime();
        }
        return Date.now() - this.seenOn.getTime();
      }
    }
  });
}
Peer.prototype.toString = function toString() {
  return this.ipAddress + ':' + this.port;
};

var AnnounceResponse = module.exports = function AnnounceResponse(bytes) {
  UdpResponse.call(this,bytes);
  UdpResponse.enforceLength(bytes, 20);
  Object.defineProperties(this,{
    _interval: {
      value: bytes.slice(8,12)
    },
    interval: {
      enumerable: true,
      get: function() {
        return this._interval.readInt32BE(0);
      }
    },
    _leechers: {
      value: bytes.slice(12,16)
    },
    leechers: {
      enumerable: true,
      get: function() {
        return this._leechers.readInt32BE(0);
      }
    },
    _seeders: {
      value: bytes.slice(16,20)
    },
    seeders: {
      enumerable: true,
      get: function() {
        return this._seeders.readInt32BE(0);
      }
    },
    _peers: {
      value: bytes.slice(20)
    },
    peers: {
      value: [],
      enumerable: true
    }
  });
  if (this._peers.length % 6 > 0) {
    throw new Error('peers body is not divisible by 6 bytes');
  }
  for(var i = 0; i < this._peers.length; i+=6) {
    this.peers.push(new Peer(this._peers.slice(i,i+6)));
  }
};
util.inherits(AnnounceResponse,UdpResponse);