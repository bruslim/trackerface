/*jshint node: true */

'use strict';

var AnnounceResponse = require('../lib/AnnounceResponse');
var Peer = require('../lib/Peer');
var ip = require('ip');

var bencode = require('bxxcode');

console.log('ip', ip.toString(new Buffer('127.0.0.1')));
console.log('ip', ip.toString(new Buffer([127,0,0,1])));

var test = Peer.parseCompact(new Buffer([127,0,0,1,255,255]));
console.log(typeof(test), Object.keys(test));
console.log(bencode.encode(test).toString());
console.log(bencode.encode(test.asCompact()).toString());
console.log(test._ipAddress, test._port);
console.log(JSON.stringify(test));

var res = new AnnounceResponse();

res.peers = [
  {
    'peer id': 'asdfasdf',
    ip: '127.0.0.1',
    port: 6543
  },
  {
    'peer id': '0986553',
    ip: '192.0.0.1',
    port: 234
  }
];
console.log('peers',JSON.stringify(res.peers));

res.isCompact = true;

console.log('peers compact: ', res.peers);

var res2 = new AnnounceResponse();

res2.peers = res.peers;
console.log('peers2 object: ', JSON.stringify(res2._peers));
console.log('peers2 compact: ', res2.peers);
