/*jshint node: true*/

'use strict';

var events = require('events');
var util = require('util');
var dns = require('dns');
var url = require('url');
var crypto = require('crypto');
var ip = require('ip');
var dgram = require('dgram');

var bigint = require('bigint');
var RSVP = require('rsvp');
RSVP.on('error', function(reason) {
  console.assert(false, reason);
});

var UdpError = require('./UdpError.js');
var TorrentMonitor = require('./TorrentMonitor.js');
var UdpClient = require('./UdpClient.js');
var Event = require('./UdpEvent.js');
var Action = require('./UdpAction.js');
var Responses = require('./UdpResponses.js');

var UdpKernel = module.exports = function UdpKernel(port, timeout) {
  events.EventEmitter.call(this);
  
  Object.defineProperties(this,{
    _timeout: {
      value: timeout || 1500,
      writable: true
    },
    _ipAddress: {
      get: function() {
        return ip.toBuffer(this.ipAddress);
      }
    },
    ipAddress: {
      get: function() {
        return ip.address();
      }
    },
    _peerId: {
      // 20 byte string
      value: new Buffer(crypto.randomBytes(10).toString('hex'))
    },
    _port: {
      get: function() {
        var b = new Buffer(2);
        b.writeInt16BE(this.port,0);
        return b;
      }
    },
    port: {
      enumerable: true,
      value: port
    },
    socket: {
      enumerable: true,
      value: dgram.createSocket('udp4')
    },
    trackers: {
      enumerable: true,
      value: {}
    },
    connections: {
      enumerable: true,
      value: {}
    },
    transactions: {
      enumerable: true,
      value: {}
    },
    pending: {
      enumerable: true,
      value: {}
    }
  });
  
  // bind the port
  this.socket.bind(port);
  // localize this
  var self = this;
  // listen for message
  this.socket.on('message', function(msg, rInfo) { 
    self.routeMessage(msg,rInfo); 
  });
};
util.inherits(UdpKernel,events.EventEmitter);


UdpKernel.prototype.generateTransactionId = function() {
  var id;
  while(true) {
    id = crypto.randomBytes(4);
    var key = id.toString('base64');
    if (!this.transactions[key] && 
        !this.pending[key]) {
      this.pending[key] = true;
      return id;
    }
  }
};

/**
 * Sends the messgage passed into the function to the tracker.
 * @param tracker {UdpTracker}  - 
 * @param callback {Function} - callback called when response is received
 */
UdpKernel.prototype.sendMessage = function(tracker, request, callback) {
  // localize this in closure
  var self = this;
 
  var deferred = RSVP.defer();
  
  var msg = request.toBuffer();
  
  // send the message to the tracker
  self.socket.send(msg, 0, msg.length, tracker.port, tracker.hostname, function(err) {

    // if we had an error
    if (err) {
      // delete from pending
      delete self.pending[request.transactionKey];

      // reject the promise, pass the error
      deferred.reject(err);

      // exit the callback
      return;
    }

    // store the deferred object, and callback with the transaction key
    self.transactions[request.transactionKey] = { 
      timer: setTimeout(function(){
        // delete the transaction key
        delete self.transactions[request.transactionKey];
        // reject the promise
        deferred.reject(new Error('timeout expired'));
      }, self._timeout),
      deferred: deferred
    };

    // delete from pending
    delete self.pending[request.transactionKey];

    self.emit('sent',request);
  });
  
  return deferred.promise;
};

UdpKernel.prototype.routeMessage = function(msg, rInfo) {
  try {
    var response = new Responses.Base(msg);
    this.emit('received', response);

    // is it in our repository of transaction keys?
    if (!this.transactions[response.transactionKey]) {
      this.emit('error',{
        message: 'Uknown transaction_id recieved.',
        response: response,
        info: rInfo,
      });
      return;
    }

    // get the deferred object by the transaction id
    // pass the message and rInfo to the callback
    var transaction = this.transactions[response.transactionKey];
    
    // clear the timer
    clearTimeout(transaction.timer);

    switch(response.action) {
        case 0:
        case 1:
        case 2:
          transaction.deferred.resolve({
            bytes: msg,
            info: rInfo
          });
          break;
        default:
          response = new Responses.Error(msg);
          transaction.deferred.reject(new UdpError(response.message, rInfo));
          break;
    }

    //remove the key
    delete this.transactions[response.transactionKey];
    
  } catch (err) {
    err.rInfo = rInfo;
    throw err;
  }
};

UdpKernel.prototype.createMonitor= function(metainfo) {
  var self = this;
  var monitor = new TorrentMonitor(metainfo);

  metainfo.flattenTrackers().forEach(function(uri){
    // ensure the uri is an object
    uri = url.parse(uri.toString());
    
    // make sure the announce uri is a udp announce
    if (uri.protocol !== 'udp:') { return; }
    
    // get the client
    var client = self.trackers[UdpClient.getKey(uri)];
    
    // if unknown, create a new client (tracker)
    if (!client) {
      // store and create a new client
      client = (self.trackers[UdpClient.getKey(uri)] = new UdpClient(this, uri));
      
      // connect to the tracker
      client.connect();
    }
    
    // bind the connected event
    client.on('connected', function(response){
      monitor.emit('connected', response);
    });
    
    // bind the error event for the torrent
    client.on('error', function(err){
      monitor.emit('error',{ error: err, client: client });
    });
    
    // tell the tracker to monitor this torrent
    client.monitor(monitor);
    
    // scrape the tracker
    // client.scrape();
    
    //client.announce(monitor, Event.STARTED);
  
  },this);

  return monitor;
};

