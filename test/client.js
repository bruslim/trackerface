/*jshint node: true */

'use strict';

var UdpKernel = require('../lib/UdpKernel');
var UdpTraker = require('../lib/UdpTracker');

var dgram = require('dgram');

var socket = dgram.createSocket('udp4');

var kernel = new UdpKernel(socket);

var 

var HttpClient = require('../lib/HttpClient');

//var client = new HttpClient('http://open.nyaatorrents.info:6544/announce');
var client = new HttpClient('http://torrent.ubuntu.com:6969/announce');
//var client = new HttpClient('http://tracker.ex.ua/announce');

client.scrape(
  [ 
    // nyaa
    //new Buffer('708e33dfd1f558e804a413e77e3e57acca90e659','hex') ,
    // ubuntu
    //new Buffer('/9HWa9SrSrmvCIVIWbETXgDtvqw=','base64'),
    //new Buffer('/54DReFb4Leams7A6YVZ3SwXkRY=','base64')
    // ex.ua
    //new Buffer('jKN428j2LgTfSkoBFLZgGGZsF80=','base64')
  ],
  function(err, res) {
    if (!res) {
      console.log(err.statusCode, err.body.toString());
      return;
    }
    console.log('========');
    res._fileList.forEach(function(fileStat) {
      console.log(
        fileStat.infoHash.length, 
        fileStat.infoHash.toString('base64')
        );
        console.log(fileStat);
    });   
  }
);


//client.scrape(
//  [  ],
//  function(err, res) {
//    console.log('========');
//    res._fileList.forEach(function(fileStat) {
//      console.log(
//        fileStat.infoHash.length, 
//        fileStat.infoHash.toString('base64')
//        
//      );
//    });   
//  }
//);