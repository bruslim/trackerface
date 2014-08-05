/*jshint node: true */

'use strict';

var Action = {
  CONNECT : 0,
  ANNOUNCE: 1,
  SCRAPE  : 2,
  ERROR   : 3
};
Object.defineProperty(Action, 'Buffered', {
  value: {
    CONNECT : new Buffer([0,0,0,0]),
    ANNOUNCE: new Buffer([0,0,0,1]),
    SCRAPE  : new Buffer([0,0,0,2]),
    ERROR   : new Buffer([0,0,0,3])
  }
});
Object.freeze(Action);
Object.freeze(Action.Buffered);

module.exports = Action;