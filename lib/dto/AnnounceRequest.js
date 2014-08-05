/*jshint node: true */

'use strict';

var util = require('util');
var bigint = require('bigint');
var ip = require('ip');

var Action = require('../UdpAction.js');

var ConnectRequest = require('./ConnectRequest');

var AnnounceRequest = module.exports = function AnnounceRequest(client, torrent, announceEvent) {
  ConnectRequest.call(this, client);
  
  Object.defineProperties(this,{
    _infoHash:{
      value: new Buffer(20)
    },
    infoHash: {
      enumerable: true,
      get: function() {
        return this._infoHash.toString('base64');
      },
      set: function(value){
        this.setBase64Buffer(this._infoHash,value);
      }
    },
    _peerId:{
      value: new Buffer(20)
    },
    peerId: {
      enumerable: true,
      get: function() {
        return this._peerId.toString('base64');
      },
      set: function(value){
        this.setBase64Buffer(this._peerId, value);
      }
    },
    _downloaded:{
      value: new Buffer(8)
    },
    downloaded: {
      enumerable: true,
      get: function() {
        return bigint.fromBuffer(this._downloaded);
      },
      set: function(value){
        this.setIntBuffer(this._downloaded,value);
      }
    },
    _left:{
      value: new Buffer(8)
    },
    left: {
      enumerable: true,
      get: function() {
        return bigint.fromBuffer(this._left);
      },
      set: function(value){
        this.setIntBuffer(this._left,value);
      }
    },
    _uploaded:{
      value: new Buffer(8)
    },
    uploaded: {
      enumerable: true,
      get: function() {
        return bigint.fromBuffer(this._uploaded);
      },
      set: function(value){
        this.setIntBuffer(this._uploaded, value);
      }
    },
    _event:{
      value: new Buffer(4)
    },
    event: {
      enumerable: true,
      get: function() {
        return this._event.readInt32BE(0);
      },
      set: function(value){
        this.setIntBuffer(this._event,value);
      }
    },
    _ipAddress:{
      value: new Buffer(4)
    },
    ipAddress: {
      enumerable: true,
      get: function() {
        return ip.toString(this._ipAddress);
      },
      set: function(value){
        if(Buffer.isBuffer(value)) {
          value.copy(this._ipAddress);
          return;
        }
        ip.toBuffer(value, this._ipAddress);
      }
    },
    _key:{
      value: new Buffer(4)
    },
    key: {
      enumerable: true,
      get: function() {
        return this._key.readInt32BE(0);
      },
      set: function(value){
        this.setIntBuffer(this._key,value);
      }
    },
    _numWant:{
      value: new Buffer(4)
    },
    numWant: {
      enumerable: true,
      get: function() {
        return this._numWant.readInt32BE(0);
      },
      set: function(value){
        this.setIntBuffer(this._numWant,value);
      }
    },
    _port:{
      value: new Buffer(2)
    },
    port: {
      enumerable: true,
      get: function() {
        return this._port.readUInt16BE(0);
      },
      set: function(value){
        this.setIntBuffer(this._port,value);
      }
    },
  });
  
  if (client) {
   
    this.infoHash = torrent._infoHash;
    this.peerId = client.kernel._peerId;
    this.downloaded = torrent._downloaded;
    this.left = torrent._left;
    this.uploaded = torrent._uploaded;
    this.event = announceEvent;

    // push the ip address if tracker is a private ip
    if (ip.isPrivate(client.address)) {
      this.ipAddress = client.kernel.ipAddress;
    } else {
      this.ipAddress = new Buffer([0,0,0,0]);
    }
    
    this.key = torrent._key;
    this.numWant = torrent.numWant;
    this.port = client.kernel.port;
    
  }
};

util.inherits(AnnounceRequest, ConnectRequest);

Object.defineProperties(AnnounceRequest.prototype,{
  _keys: {
    value: ConnectRequest.prototype._keys.concat([
      '_infoHash',
      '_peerId',
      '_downloaded',
      '_left',
      '_uploaded',
      '_event',
      '_ipAddress',
      '_key',
      '_numWant',
      '_port'
    ])
  },
  _action: {
    value: Action.Buffered.ANNOUNCE
  }
});