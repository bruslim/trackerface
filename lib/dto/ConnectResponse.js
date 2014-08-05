/*jshint node: true */

'use strict';

var util = require('util');
var bigint = require('bigint');
var ip = require('ip');

var UdpResponse = require('./UdpResponse');

var ConnectResponse = module.exports = function ConnectResponse(bytes) {
  UdpResponse.call(this, bytes);
  UdpResponse.enforceLength(bytes, 16);
  Object.defineProperties(this,{
    _connectionId: {
      value: bytes.slice(8,16)
    },
    connectionId: {
      enumerable: true,
      get: function() {
        return bigint.fromBuffer(this._connectionId);
      }
    }
  });
};
util.inherits(ConnectResponse, UdpResponse);