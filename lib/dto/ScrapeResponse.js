/*jshint node: true */

'use strict';

var util = require('util');
var bigint = require('bigint');
var ip = require('ip');

var UdpResponse = require('./UdpResponse');

function Stat(bytes) {
  UdpResponse.enforceLength(bytes, 12);
  Object.defineProperties(this,{
    _seeders: {
      value: bytes.slice(0,4),
    },
    seeders: {
      enumerable: true,
      get: function() {
        return this._seeders.readInt32BE(0);
      }
    },
    _completed: {
      value: bytes.slice(4,8),
    },
    completed: {
      enumerable: true,
      get: function() {
        return this._completed.readInt32BE(0);
      }
    },
    _leechers: {
      value: bytes.slice(8,12),
    },
    leechers: {
      enumerable: true,
      get: function() {
        return this._leechers.readInt32BE(0);
      }
    }
  });
}

var ScrapeResponse = module.exports = function ScrapeResponse(bytes) {
  UdpResponse.call(this, bytes);
  if (this._body.length % 12 > 0) {
    throw new Error('stats body is not divisble by 12 bytes');
  }
  Object.defineProperties(this,{
    stats: {
      value: [],
      enumerable: true
    }
  });
  for(var i = 0; i < this._body.length; i+= 12) {
    this.stats.push(new Stat(this._body.slice(i, i+12)));
  }
};
util.inherits(ScrapeResponse, UdpResponse);