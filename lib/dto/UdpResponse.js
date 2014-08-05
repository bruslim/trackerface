/*jshint node: true */

'use strict';

var util = require('util');
var bigint = require('bigint');
var ip = require('ip');

var UdpResponse = module.exports = function UdpResponse(bytes) {
  if (!this || !(this instanceof UdpResponse)) {
    throw new Error('UdpResponse must be invoked with new.');
  }
  if (!Buffer.isBuffer(bytes)) {
    throw new Error('bytes must be a buffer.');
  }
  UdpResponse.enforceLength(bytes, 8);
  Object.defineProperties(this,{
    _action: {
      value: bytes.slice(0,4)
    },
    action: {
      enumerable: true,
      get: function() {
        return this._action.readInt32BE(0);
      }
    },
    _transactionId: {
      value: bytes.slice(4,8)
    },
    transactionId: {
      enumerable: true,
      get: function() {
        return this._transactionId.readUInt32BE(0);
      }
    },
    transactionKey: {
      enumerable: true,
      get: function() {
        return this._transactionId.toString('base64');
      }
    },
    _body: {
      value: bytes.slice(8)
    }
  });
};
UdpResponse.enforceLength = function enforceLength(bytes, length) {
  if (!Buffer.isBuffer(bytes)) {
    throw new TypeError("bytes must be a Buffer");
  }
  if (bytes.length < length) {
    throw new Error('bytes must be at least ' + length + ' bytes.');
  }
};
