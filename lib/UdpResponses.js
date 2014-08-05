/*jshint node: true */

'use strict';

module.exports = {
  Base: require('./dto/UdpResponse'),
  Connect: require('./dto/ConnectResponse'),
  Announce: require('./dto/AnnounceResponse'),
  Scrape: require('./dto/ScrapeResponse'),
  Error: require('./dto/ErrorResponse')
};