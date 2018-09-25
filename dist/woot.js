(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Woot = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
function Identifier (site, clock) {
  var self = this

  self.site = site
  self.clock = clock
}

Identifier.prototype.equals = function (other) {
  var self = this

  return self.site === other.site && self.clock === other.clock
}

Identifier.prototype.isLessThan = function (other) {
  var self = this

  return self.site < other.site || (self.site === other.site && self.clock < other.clock)
}

module.exports = Identifier

},{}],8:[function(require,module,exports){
// A ordinary, non-CRDT sequence
// Just a wrapper around an array to make WString neater

function Sequence (init) {
  this._elements = init
}

Sequence.prototype.elements = function () {
  return this._elements
}

Sequence.prototype.isEmpty = function () {
  return this.length() === 0
}

Sequence.prototype.length = function () {
  return this._elements.length
}

Sequence.prototype.contains = function (id) {
  return this.findIndex(id) !== -1
}

Sequence.prototype.get = function (index) {
  return this._elements[index]
}

Sequence.prototype.getFiltered = function (index, filter) {
  // TODO: No point filtering things after the target
  return this._elements.filter(filter)[index]
}

Sequence.prototype.insert = function (character, index) {
  this._elements.splice(index, 0, character)
}

Sequence.prototype.find = function (id) {
  return this._elements.find(x => {
    return id.equals(x.id)
  })
}

Sequence.prototype.findIndex = function (id) {
  return this._elements.findIndex(x => {
    return id.equals(x.id)
  })
}

// finds what the index would be in a filtered subsequence
Sequence.prototype.findFilteredIndex = function (id, filter) {
  // TODO: No point filtering things after the target
  return this._elements.filter(filter).findIndex(x => {
    return id.equals(x.id)
  })
}

Sequence.prototype.subsequence = function (start, end) {
  return new Sequence(this._elements.slice(start, end))
}

module.exports = Sequence

},{}],9:[function(require,module,exports){
function WChar (opts) {
  this.id = opts.id
  this.value = opts.value
  this.isVisible = opts.isVisible
  this.prevId = opts.prevId
  this.nextId = opts.nextId
}

module.exports = WChar

},{}],10:[function(require,module,exports){
const WChar = require('./w-char')
const Identifier = require('./identifier')
const EventEmitter = require('nanobus')
const inherits = require('inherits')
const Sequence = require('./sequence')

inherits(WString, EventEmitter)

function WString (site, state) {
  var self = this

  EventEmitter.call(self)

  self.site = site
  self._clock = 0
  self._chars = []
  self._pool = []

  if (state) {
    self.setState(state)
  } else {
    // The "virtual" start and end characters. They use the null siteID
    var startChar = new WChar({
      id: new Identifier(null, 0),
      value: '',
      isVisible: true
    })
    var endChar = new WChar({
      id: new Identifier(null, 1),
      value: '',
      isVisible: true
    })

    self._chars = new Sequence([startChar, endChar])
  }
}

WString.prototype.receive = function (operation) {
  var self = this

  if (self._isExecutable(operation)) {
    self._execute(operation)
  } else {
    self._pool.push(operation)
  }
}

WString.prototype._isExecutable = function (operation) {
  var self = this

  if (operation.isDelete) {
    return self._chars.contains(operation.id)
  } else {
    return self._chars.contains(operation.prevId) && self._chars.contains(operation.nextId)
  }
}

WString.prototype._execute = function (operation) {
  var self = this

  if (operation.isDelete) {
    self._integrateDelete(operation)
  } else {
    self._integrateInsertion(operation)
  }

  // check pool after execution
  var index = self._pool.findIndex(x => self._isExecutable(x))
  if (index === -1) return
  var op = self._pool[index]
  self._pool.splice(index, 1) // remove from pool immediately
  self._execute(op)
}

WString.prototype.insert = function (value, index) {
  var self = this
  value.split('').forEach((character, i) => {
    self._insert(character, index + i)
  })
}

WString.prototype._insert = function (value, index) {
  var self = this

  var prevChar = self._chars.getFiltered(index, x => x.isVisible)
  var nextChar = self._chars.getFiltered(index + 1, x => x.isVisible)

  if (!prevChar || !nextChar) return

  var operation = {
    isDelete: false,
    id: new Identifier(self.site, self._clock++),
    value: value,
    prevId: prevChar.id,
    nextId: nextChar.id
  }

  self.receive(operation)
  self.emit('operation', operation)
}

WString.prototype._integrateInsertion = function ({ id, value, prevId, nextId }) {
  var self = this

  if (self._chars.find(id)) return // more-than-once delivery

  self._recursiveIntegrate(
    new WChar({
      id: id,
      value: value,
      isVisible: true,
      prevId: prevId,
      nextId: nextId
    }),
    self._chars.find(prevId),
    self._chars.find(nextId)
  )
}

WString.prototype._recursiveIntegrate = function (char, prev, next) {
  var self = this

  var lowerBound = self._chars.findIndex(prev.id)
  var upperBound = self._chars.findIndex(next.id)

  var SP = self._chars.subsequence(lowerBound + 1, upperBound)

  if (SP.isEmpty()) {
    self._chars.insert(char, upperBound) // insert between

    self.emit('insert', {
      value: char.value,
      index: self._chars.findFilteredIndex(char.id, x => x.isVisible)
    })
  } else {
    var L = []

    L.push(prev)
    SP.elements().forEach(dChar => {
      var dPrevIndex = SP.findIndex(dChar.prevId)
      var dNextIndex = SP.findIndex(dChar.nextId)

      if (dPrevIndex <= lowerBound && dNextIndex <= upperBound) {
        L.push(dChar)
      }
    })
    L.push(next)

    var i = 1
    while (i < L.length - 1 && L[i].id.isLessThan(char.id)) {
      i = i + 1
    }

    self._recursiveIntegrate(char, L[i - 1], L[i])
  }
}

WString.prototype.delete = function (index, length = 1) {
  var self = this

  for (var i = length - 1; i >= 0; i--) { // runs backwards to avoid changing the visible index
    self._delete(index + i + 1)
  }
}

WString.prototype._delete = function (index) {
  var self = this

  var char = self._chars.getFiltered(index, x => x.isVisible)

  if (!char || char.id.site === null) return

  var operation = {
    isDelete: true,
    id: char.id
  }
  self.receive(operation)
  self.emit('operation', operation)
}

WString.prototype._integrateDelete = function ({ id }) {
  var self = this

  if (id.site === null) throw new Error('fucked up _integrateDelete yo')

  var char = self._chars.find(id)

  if (char.isVisible && id.site !== self.site) {
    var visibleIndex = self._chars.findFilteredIndex(id, x => x.isVisible)
    char.isVisible = false

    self.emit('delete', {
      value: char.value,
      index: visibleIndex
    })
  } else {
    char.isVisible = false
  }
}

// construct a string from the sequence
WString.prototype.value = function () {
  var self = this
  return self._chars.elements().filter(char => char.isVisible).map(char => char.value).join('')
}

WString.prototype.replaceRange = function (value, start, length) {
  var self = this

  self.delete(start, length)
  self.insert(value, start)
}

WString.prototype.setValue = function (value) {
  var self = this

  self.replaceRange(value, 0, self.value().length)
}

WString.prototype.getState = function () {
  var self = this
  return JSON.stringify({
    chars: self._chars.elements(),
    pool: self._pool
  })
}

WString.prototype.setState = function (state) {
  var self = this

  var parsed = JSON.parse(state)

  self._chars = new Sequence(parsed.chars.map(x => {
    x.id = new Identifier(x.id.site, x.id.clock)
    if (x.prevId) x.prevId = new Identifier(x.prevId.site, x.prevId.clock)
    if (x.nextId) x.nextId = new Identifier(x.nextId.site, x.nextId.clock)
    return new WChar(x)
  }))
  self._pool = parsed.pool
}

module.exports = WString

},{"./identifier":7,"./sequence":8,"./w-char":9,"inherits":1,"nanobus":3}]},{},[10])(10)
});