(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Logoot = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
assert.notEqual = notEqual
assert.notOk = notOk
assert.equal = equal
assert.ok = assert

module.exports = assert

function equal (a, b, m) {
  assert(a == b, m) // eslint-disable-line eqeqeq
}

function notEqual (a, b, m) {
  assert(a != b, m) // eslint-disable-line eqeqeq
}

function notOk (t, m) {
  assert(!t, m)
}

function assert (t, m) {
  if (!t) throw new Error(m || 'AssertionError')
}

},{}],3:[function(require,module,exports){
var splice = require('remove-array-items')
var nanotiming = require('nanotiming')
var assert = require('assert')

module.exports = Nanobus

function Nanobus (name) {
  if (!(this instanceof Nanobus)) return new Nanobus(name)

  this._name = name || 'nanobus'
  this._starListeners = []
  this._listeners = {}
}

Nanobus.prototype.emit = function (eventName) {
  assert.equal(typeof eventName, 'string', 'nanobus.emit: eventName should be type string')

  var data = []
  for (var i = 1, len = arguments.length; i < len; i++) {
    data.push(arguments[i])
  }

  var emitTiming = nanotiming(this._name + "('" + eventName + "')")
  var listeners = this._listeners[eventName]
  if (listeners && listeners.length > 0) {
    this._emit(this._listeners[eventName], data)
  }

  if (this._starListeners.length > 0) {
    this._emit(this._starListeners, eventName, data, emitTiming.uuid)
  }
  emitTiming()

  return this
}

Nanobus.prototype.on = Nanobus.prototype.addListener = function (eventName, listener) {
  assert.equal(typeof eventName, 'string', 'nanobus.on: eventName should be type string')
  assert.equal(typeof listener, 'function', 'nanobus.on: listener should be type function')

  if (eventName === '*') {
    this._starListeners.push(listener)
  } else {
    if (!this._listeners[eventName]) this._listeners[eventName] = []
    this._listeners[eventName].push(listener)
  }
  return this
}

Nanobus.prototype.prependListener = function (eventName, listener) {
  assert.equal(typeof eventName, 'string', 'nanobus.prependListener: eventName should be type string')
  assert.equal(typeof listener, 'function', 'nanobus.prependListener: listener should be type function')

  if (eventName === '*') {
    this._starListeners.unshift(listener)
  } else {
    if (!this._listeners[eventName]) this._listeners[eventName] = []
    this._listeners[eventName].unshift(listener)
  }
  return this
}

Nanobus.prototype.once = function (eventName, listener) {
  assert.equal(typeof eventName, 'string', 'nanobus.once: eventName should be type string')
  assert.equal(typeof listener, 'function', 'nanobus.once: listener should be type function')

  var self = this
  this.on(eventName, once)
  function once () {
    listener.apply(self, arguments)
    self.removeListener(eventName, once)
  }
  return this
}

Nanobus.prototype.prependOnceListener = function (eventName, listener) {
  assert.equal(typeof eventName, 'string', 'nanobus.prependOnceListener: eventName should be type string')
  assert.equal(typeof listener, 'function', 'nanobus.prependOnceListener: listener should be type function')

  var self = this
  this.prependListener(eventName, once)
  function once () {
    listener.apply(self, arguments)
    self.removeListener(eventName, once)
  }
  return this
}

Nanobus.prototype.removeListener = function (eventName, listener) {
  assert.equal(typeof eventName, 'string', 'nanobus.removeListener: eventName should be type string')
  assert.equal(typeof listener, 'function', 'nanobus.removeListener: listener should be type function')

  if (eventName === '*') {
    this._starListeners = this._starListeners.slice()
    return remove(this._starListeners, listener)
  } else {
    if (typeof this._listeners[eventName] !== 'undefined') {
      this._listeners[eventName] = this._listeners[eventName].slice()
    }

    return remove(this._listeners[eventName], listener)
  }

  function remove (arr, listener) {
    if (!arr) return
    var index = arr.indexOf(listener)
    if (index !== -1) {
      splice(arr, index, 1)
      return true
    }
  }
}

Nanobus.prototype.removeAllListeners = function (eventName) {
  if (eventName) {
    if (eventName === '*') {
      this._starListeners = []
    } else {
      this._listeners[eventName] = []
    }
  } else {
    this._starListeners = []
    this._listeners = {}
  }
  return this
}

Nanobus.prototype.listeners = function (eventName) {
  var listeners = eventName !== '*'
    ? this._listeners[eventName]
    : this._starListeners

  var ret = []
  if (listeners) {
    var ilength = listeners.length
    for (var i = 0; i < ilength; i++) ret.push(listeners[i])
  }
  return ret
}

Nanobus.prototype._emit = function (arr, eventName, data, uuid) {
  if (typeof arr === 'undefined') return
  if (arr.length === 0) return
  if (data === undefined) {
    data = eventName
    eventName = null
  }

  if (eventName) {
    if (uuid !== undefined) {
      data = [eventName].concat(data, uuid)
    } else {
      data = [eventName].concat(data)
    }
  }

  var length = arr.length
  for (var i = 0; i < length; i++) {
    var listener = arr[i]
    listener.apply(listener, data)
  }
}

},{"assert":2,"nanotiming":5,"remove-array-items":6}],4:[function(require,module,exports){
var assert = require('assert')

var hasWindow = typeof window !== 'undefined'

function createScheduler () {
  var scheduler
  if (hasWindow) {
    if (!window._nanoScheduler) window._nanoScheduler = new NanoScheduler(true)
    scheduler = window._nanoScheduler
  } else {
    scheduler = new NanoScheduler()
  }
  return scheduler
}

function NanoScheduler (hasWindow) {
  this.hasWindow = hasWindow
  this.hasIdle = this.hasWindow && window.requestIdleCallback
  this.method = this.hasIdle ? window.requestIdleCallback.bind(window) : this.setTimeout
  this.scheduled = false
  this.queue = []
}

NanoScheduler.prototype.push = function (cb) {
  assert.equal(typeof cb, 'function', 'nanoscheduler.push: cb should be type function')

  this.queue.push(cb)
  this.schedule()
}

NanoScheduler.prototype.schedule = function () {
  if (this.scheduled) return

  this.scheduled = true
  var self = this
  this.method(function (idleDeadline) {
    var cb
    while (self.queue.length && idleDeadline.timeRemaining() > 0) {
      cb = self.queue.shift()
      cb(idleDeadline)
    }
    self.scheduled = false
    if (self.queue.length) self.schedule()
  })
}

NanoScheduler.prototype.setTimeout = function (cb) {
  setTimeout(cb, 0, {
    timeRemaining: function () {
      return 1
    }
  })
}

module.exports = createScheduler

},{"assert":2}],5:[function(require,module,exports){
var scheduler = require('nanoscheduler')()
var assert = require('assert')

var perf
nanotiming.disabled = true
try {
  perf = window.performance
  nanotiming.disabled = window.localStorage.DISABLE_NANOTIMING === 'true' || !perf.mark
} catch (e) { }

module.exports = nanotiming

function nanotiming (name) {
  assert.equal(typeof name, 'string', 'nanotiming: name should be type string')

  if (nanotiming.disabled) return noop

  var uuid = (perf.now() * 10000).toFixed() % Number.MAX_SAFE_INTEGER
  var startName = 'start-' + uuid + '-' + name
  perf.mark(startName)

  function end (cb) {
    var endName = 'end-' + uuid + '-' + name
    perf.mark(endName)

    scheduler.push(function () {
      var err = null
      try {
        var measureName = name + ' [' + uuid + ']'
        perf.measure(measureName, startName, endName)
        perf.clearMarks(startName)
        perf.clearMarks(endName)
      } catch (e) { err = e }
      if (cb) cb(err, name)
    })
  }

  end.uuid = uuid
  return end
}

function noop (cb) {
  if (cb) {
    scheduler.push(function () {
      cb(new Error('nanotiming: performance API unavailable'))
    })
  }
}

},{"assert":2,"nanoscheduler":4}],6:[function(require,module,exports){
'use strict'

/**
 * Remove a range of items from an array
 *
 * @function removeItems
 * @param {Array<*>} arr The target array
 * @param {number} startIdx The index to begin removing from (inclusive)
 * @param {number} removeCount How many items to remove
 */
module.exports = function removeItems(arr, startIdx, removeCount)
{
  var i, length = arr.length

  if (startIdx >= length || removeCount === 0) {
    return
  }

  removeCount = (startIdx + removeCount > length ? length - startIdx : removeCount)

  var len = length - removeCount

  for (i = startIdx; i < len; ++i) {
    arr[i] = arr[i + removeCount]
  }

  arr.length = len
}

},{}],7:[function(require,module,exports){
function Identifier (int, site) {
  this.int = int
  this.site = site
}
Identifier.prototype.compare = function (other) {
  if (this.int > other.int) {
    return 1
  } else if (this.int < other.int) {
    return -1
  } else {
    if (this.site > other.site) {
      return 1
    } else if (this.site < other.site) {
      return -1
    } else {
      return 0
    }
  }
}
module.exports = Identifier

},{}],8:[function(require,module,exports){
const EventEmitter = require('nanobus')
const inherits = require('inherits')

const Line = require('./line')
const Position = require('./position')
const Identifier = require('./identifier')

inherits(Logoot, EventEmitter)

const MIN = -Number.MAX_SAFE_INTEGER
const MAX = Number.MAX_SAFE_INTEGER

function Logoot (site, state) {
  var self = this

  EventEmitter.call(self)

  self.site = site
  self._clock = 0
  self._lines = [
    new Line(new Position([new Identifier(MIN, null)]), null, null),
    new Line(new Position([new Identifier(MAX, null)]), null, null)
  ]

  if (state) self.setState(state)
}

function parseLine (line) {
  return new Line(
    new Position(line.pos.ids.map(id => new Identifier(id.int, id.site))),
    line.clock,
    line.value
  )
}

Logoot.prototype.receive = function (operation) {
  var self = this

  operation.line = parseLine(operation.line)

  if (operation.type === 'insert') {
    const index = self._findLineIndex(operation.line)
    if (self._lines[index].pos.compare(operation.line.pos)) {
      self._lines.splice(index, 0, operation.line)
    }
  } else {
    const index = self._findLineIndex(operation.line)
    if (self._lines[index].value == null) return // can't delete end positions
    self._lines.splice(index, 1)
  }
}

Logoot.prototype.insert = function (value, index) {
  var self = this
  value.split('').forEach((character, i) => {
    self._insert(character, index + i)
  })
}

Logoot.prototype._insert = function (value, index) {
  var self = this

  const prev = self._lines[index]
  const next = self._lines[index + 1]

  if (!prev || !next) return

  const line = self._generateLine(prev, next, value)
  self._lines.splice(index + 1, 0, line)

  self.emit('operation', { type: 'insert', line })
}

function randomInt (a, b) {
  return Math.floor(Math.random() * (b - a)) + a
}

Logoot.prototype._generateLine = function (prev, next, value) {
  const self = this

  // first, find the common prefix of both position identifiers
  const newPosition = []
  var index = 0

  while (prev.pos.ids[index].compare(next.pos.ids[index]) === 0) {
    newPosition.push(prev.pos.ids[index])
    index++
  }

  const prevId = prev.pos.ids[index]
  const nextId = next.pos.ids[index]
  const diff = nextId.int - prevId.int

  if (diff > 1) { // enough room for integer between prevInt and nextInt
    newPosition.push(new Identifier(randomInt(prevId.int, nextId.int), self.site))
  } else if (diff === 1 && self.site > prevId.site) { // same, but site offers more room
    newPosition.push(new Identifier(prevId.int, self.site))
  } else { // no room, need to add a new id
    newPosition.push(prevId)
    newPosition.push(new Identifier(randomInt(MIN, MAX), self.site))
  }

  return new Line(new Position(newPosition), ++self._clock, value)
}

Logoot.prototype._findLineIndex = function (line) {
  const self = this

  var L = 0
  var R = self._lines.length

  while (L < R) {
    var M = Math.floor((L + R) / 2)
    if (self._lines[M].pos.compare(line.pos) === -1) {
      L = M + 1
    } else {
      R = M
    }
  }
  return L
}

Logoot.prototype.delete = function (index, length = 1) {
  var self = this

  for (var i = 0; i < length; i++) {
    self._delete(index + 1)
  }
}

Logoot.prototype._delete = function (index) {
  var self = this

  const line = self._lines[index]
  if (!line || line.value === null) return
  self._lines.splice(index, 1)
  self.emit('operation', { type: 'delete', line })
}

// construct a string from the sequence
Logoot.prototype.value = function () {
  var self = this

  return self._lines.map(line => line.value).join('')
}

Logoot.prototype.replaceRange = function (value, start, length) {
  var self = this

  self.delete(start, length)
  self.insert(value, start)
}

Logoot.prototype.setValue = function (value) {
  var self = this

  self.replaceRange(value, 0, self.value().length)
}

Logoot.prototype.getState = function () {
  const self = this

  return JSON.stringify({
    lines: self._lines
  })
}

Logoot.prototype.setState = function (state) {
  const self = this

  const parsed = JSON.parse(state)

  self._lines = parsed.lines.map(parseLine)
}

module.exports = Logoot

},{"./identifier":7,"./line":9,"./position":10,"inherits":1,"nanobus":3}],9:[function(require,module,exports){
function Line (pos, clock, value) {
  this.pos = pos
  this.clock = clock
  this.value = value
}
module.exports = Line

},{}],10:[function(require,module,exports){
function Position (ids) {
  this.ids = ids
}

Position.prototype.compare = function (other) {
  var self = this

  var minLength = Math.min(self.ids.length, other.ids.length)

  for (var i = 0; i < minLength; i++) {
    switch (self.ids[i].compare(other.ids[i])) {
      case 0:
        continue // all checked so far are equal, continue
      case 1:
        return 1 // rightmost checked value is greater
      case -1:
        return -1 // rightmost checked value is lesser
    }
  }
  if (self.ids.length > minLength) {
    return 1
  } else if (other.ids.length > minLength) {
    return -1 // other has extended length
  } else {
    return 0 // all equal
  }
}

module.exports = Position

},{}]},{},[8])(8)
});