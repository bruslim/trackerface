/*jshint node: true */

'use strict';

var util = require('util');
var bigint = require('bigint');
var ip = require('ip');

var Action = require('../UdpAction.js');

var ConnectRequest = module.exports = function ConnectRequest(client) {
  Object.defineProperties(this,{
    _client: {
      value: client
    },
    _connectionId: {
      // start with magic buffer
      value: new Buffer('0000041727101980','hex')
    },
    connectionId: {
      enumerable: true,
      get: function() {
        return bigint.fromBuffer(this._connectionId).toString();
      },
      set: function(value) {
        this.setIntBuffer(this._connectionId,value);
      }
    },
    action: {
      enumerable: true,
      get: function() {
        return this._action.readInt32BE(0);
      }
    },
    _transactionId: {
      value: new Buffer(4),
    },
    transactionId: {
      enumerable: true,
      get: function() {
        return this._transactionId.readUInt32BE(0);
      },
      set: function(value) {
        this.setIntBuffer(this._transactionId,value);
      }
    },
    transactionKey: {
      enumerable: true,
      get: function() {
        return this._transactionId.toString('base64');
      }
    }
  });
  
  // init 
  if (client) {
    this.connectionId = client.connectionId;
    this.transactionId = client.kernel.generateTransactionId();
  }
};

Object.defineProperties(ConnectRequest.prototype,{
  _keys:{
    value:[
      '_connectionId', 
      '_action',
      '_transactionId'
    ]
  },
  _action: {
    value: Action.Buffered.CONNECT
  }
});

ConnectRequest.prototype.toBuffer = function toBuffer() {
  var buffers = [];
  
  this._keys.forEach(function(key){
    buffers.push(this[key]);
  }, this);
  
  return Buffer.concat(buffers);
};

ConnectRequest.prototype.setIntBuffer = function setIntBuffer(buffer, value) {
  if (Buffer.isBuffer(value)) {
    value.copy(buffer, buffer.length - value.length);
    return;
  }
  var isBigint = value instanceof bigint;
  switch(buffer.length) {
    case 2:
      buffer.writeUInt16BE(value.toString(), 0);
      return;
    case 4:
      buffer.writeInt32BE(value.toString(), 0);
      return;
    default:
      if (!isBigint) {
        value = bigint(value);
      }
      break;
  }
  value = value.toBuffer();
  value.copy(buffer, buffer.length - value.length);
};

ConnectRequest.prototype.setBase64Buffer = function setBase64Buffer(buffer, value) {
  if (!Buffer.isBuffer(value)) {
    value = new Buffer(value, 'base64');
  }
  value.copy(buffer);
};