/*jshint node: true */

'use strict';

var util = require('util');
var bigint = require('bigint');
var ip = require('ip');

var UdpResponse = require('./UdpResponse');

var ErrorResponse = module.exports = function ErrorResponse(bytes) {
  UdpResponse.call(this, bytes);
  Object.defineProperties(this, {
    _message: {
      get: function() {
        var lastByte = this._body.length-1;
        if (this._body[lastByte] === 0x00) {
          return this._body.slice(0, lastByte);
        }
        return this._body;
      }
    },
    message: {
      enumerable: true,
      get: function() {
        return this._message.toString();
      }
    }
  });
};
util.inherits(ErrorResponse,UdpResponse);