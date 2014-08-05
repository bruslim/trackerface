/*jshint node: true*/

'use strict';

var events = require('events');
var util = require('util');
var dns = require('dns');
var crypto = require('crypto');
var ip = require('ip');
var url = require('url');

var bigint = require('bigint');
var RSVP = require('rsvp');

var UdpError = require('./UdpError.js');
var Event = require('./UdpEvent.js');
var Action = require('./UdpAction.js');
var TorrentStats = require('./TorrentStats.js');

var Responses = require('./UdpResponses.js');
var Requests = require('./UdpRequests.js');

var MAGIC_BUFFER = new Buffer('0000041727101980','hex');

var UdpClient = module.exports = function UdpClient(kernel, uri) {
  Object.defineProperties(this, {
    connected: {
      writable: true,
      value: RSVP.defer()
    },
    _connectionId: {
      // magic buffer
      value: (function(){ 
        var buffer = new Buffer(8);
        MAGIC_BUFFER.copy(buffer,0);
        return buffer;
      })(),
      writable: true 
    },
    connectionId: {
      enumerable: true,
      get: function() {
        return bigint.fromBuffer(this._connectionId);
      },
      set: function(value) {
        if (Buffer.isBuffer(value)) {
          value.copy(this._connectionId);
          return;
        }
        if (value instanceof bigint) {
          value.toBuffer().copy(this._connectionId);
          return;
        }
        bigint(value).toBuffer().copy(this._connectionId);
      }
    },
    kernel: {
      value: kernel,
      enumerable: true
    },
    uri: {
      value: url.parse(uri),
      enumerable: true
    },
    hostname: {
      enumerable: true,
      get: function() {
        return this.uri.hostname;
      }
    },
    address: {
      writable: true,
      enumerable: true,
    },
    port: {
      enumerable: true,
      get: function() {
        return this.uri.port;
      }
    },
    
    torrents: {
      value: {},
      enumerable: true
    },
    
    timers: {
      value: {},
      enumerable: true
    },
    interval: {
      value: 5,
      writable: true,
      enumerable: true
    },
    delay: {
      enumerable: true,
      get: function() {
        return this.interval * 1000;
      }
    },
    key: {
      enumerable: true,
      get: function() {
        return this.hostname + ':' + this.port;
      }
    }
  });
  var self = this;
  this.on('connected', function() {
    self.kernel.emit('connected',{ client: self });
  });
  this.on('error',function(err) {
    
    self.kernel.emit('error',{ error: err, client: self } );
  });
};

// use util.inherits to fix prototype chain
util.inherits(UdpClient, events.EventEmitter);

UdpClient.getKey = function(uri) {
  if (typeof(uri) === 'string') {
    uri = url.parse(uri);
  }
  return uri.hostname + ':' +  uri.port;
};

UdpClient.prototype.resetConnectionId = function() {
  // reset the connection id to the magic buffer
  this.connectionId = MAGIC_BUFFER;
  // reset the defered object to a new unresloved one
  this.connected = RSVP.defer();
};

//UdpClient.prototype.updateTimer = function() {
// 
//  var self = this;
//
//  if (this.scrapeTimer && this.scrapeTimer._idleTimeout !== this.delay) {
//    clearInterval(this.scrapeTimer);
//    this.scrapeTimer = null;
//  }
//
//  if (!this.scrapeTimer) {
//    this.scrapeTimer = setInterval(function() {
//      self.scrape();
//    }, this.delay);
//  }
//
//};

UdpClient.prototype.monitor = function(torrent) {
  var hashKey = torrent._infoHash.toString('base64');
  if (!this.torrents[hashKey]) {
    this.torrents[hashKey] = torrent;
  }
  return hashKey;
};

/**
 *
 * @param torrent {TorrentInfo} - the torrent we are announcing
 * @param [announceEvent] {Integer} - an event defined in UdpEvent.js 
 *  defults to NONE
 */
UdpClient.prototype.announce = function(torrent, announceEvent) {
  
  var self = this;
  
  this.connected.promise.then(function() {
    return new RSVP.Promise(function(resolve, reject){
      if (self.address) {
        resolve(self.address);
        return;
      }
     
      dns.lookup(self.hostname,4,function(err, address){
        
        if (err) { 
          reject(err); 
          return;
        }

        self.address = address;
        resolve(address);
        return;
      });
    });
  }).then(function(address) {
    var request = new Requests.Announce(self, torrent, announceEvent);
    // send the message
    self.kernel.sendMessage(self, request)
      .then(function(raw) {
        try {
          var torrentKey = self.monitor(torrent);

          // if the timer exists, we need to clear it
          if (self.timers[torrentKey]) {
            clearTimeout(self.timers[torrentKey]);
            self.timers[torrentKey] = null;
          }
          torrent.lastAnnounce = new Date();
          
          // parse the response
          var response = new Responses.Announce(raw.bytes);
          
          // update the interval
          self.interval = response.interval;
          
          // update stats
          var stats = torrent.stats[self.key];
          if (!stats) {
            stats = new TorrentStats();
            torrent.stats[self.key] = stats;
          }
          stats.update(response);
          
          // update started flag
          torrent.started = true;
          
//          // update the scrape timer
//          self.updateTimer(torrent.infoHash);
//
//          // setup the timeout
//          self.timers[torrentKey] = setTimeout(function() {
//            // clear the timer object
//            self.timers[torrentKey] = null;
//            // announce again without an event
//            self.announce(torrent, Event.NONE);
//          }, self.delay);
//          
          // add the peers to the torrent
          stats.addPeers(response.peers);

          // fire the updated event on the torrent
          torrent.emit('updated', response);

        } catch (err) {
          throw new UdpError(err.message, raw.info);
        }
      }).catch(function(err) {
        self.emit('error', err);
      }); 
  });
};

UdpClient.prototype.scrape = function() {
  var self = this;
  // send the msg via kernel
  this.connected.promise.then(function() {
    // make a scrape request object
    var request = new Requests.Scrape(self);

    self.kernel.sendMessage(self, request)
      .then(function(raw) {
        try {
          // set the last scrape 
          self.lastScrape = Date.now();
          
          // parse the response
          var response = new Responses.Scrape(raw.bytes);
          
          // scrape was sent in the same order 
          request.infoHashes.map(function(bytes) { 
            return bytes.toString('base64');
          }).forEach(function(key, index) {
            var torrent = self.torrents[key];
            var stats = torrent.stats[self.key];
            if (!stats) {
              stats = new TorrentStats();
              torrent.stats[self.key] = stats;
            }
            stats.update(response.stats[index]);
            torrent.emit('updated', response);
          });
        
        } catch (err) {
          throw new UdpError(err.message, raw.info);
        }
      }).catch(function(err){
        self.emit('error',err);
      });
  });
};

UdpClient.prototype.connect = function() {
  var request = new Requests.Connect(this);
  MAGIC_BUFFER.copy(request._connectionId);
  var self = this;
  this.kernel.sendMessage(this, request)
    .then(function(raw) {
      try {
        var response = new Responses.Connect(raw.bytes);
        
        response._connectionId.copy(self._connectionId);
        
        self.kernel.connections[response.connectionId] = self;
        
        // unblock announces and scrapes
        self.connected.resolve();
        self.emit('connected', response);
      } catch (err) {
        throw new UdpError(err.message, raw.info);
      }
    })
    .catch(function(err) {
      self.emit('error', err);
    });
};
