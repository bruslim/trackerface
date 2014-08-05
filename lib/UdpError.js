/*jshint node: true*/

'use strict';

var util = require('util');

var UdpError = module.exports = function UdpError(message, info) {
  if (!this || !(this instanceof UdpError)) {
    return new UdpError(message,info);
  }
  // invoke super constructor
  Error.call(this, message);
  // use v8's captureStackTrace to capture the stack trace
  Error.captureStackTrace(this, UdpError);
  // define the properties
  Object.defineProperties(this, {
    message: {
      value: message
    },
    info: {
      value: info
    }
  }); 
};
util.inherits(UdpError,Error);
UdpError.prototype.name = 'UdpError';

