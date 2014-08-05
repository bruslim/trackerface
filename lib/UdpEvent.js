/*jshint node: true */

'use strict';

var Event = {
  NONE     : 0,
  COMPLETED: 1,
  STARTED  : 2,
  STOPPED  : 3
};
Object.defineProperty(Event, 'Buffered', {
  value: {
    NONE     : new Buffer([0,0,0,0]),
    COMPLETED: new Buffer([0,0,0,1]),
    STARTED  : new Buffer([0,0,0,2]),
    STOPPED  : new Buffer([0,0,0,3])
  }
});

Object.freeze(Event);
Object.freeze(Event.Buffered);

module.exports = Event;