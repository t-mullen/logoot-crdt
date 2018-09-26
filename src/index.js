const EventEmitter = require('nanobus')
const inherits = require('inherits')

const Line = require('./line')
const Position = require('./position')
const Identifier = require('./identifier')

inherits(Logoot, EventEmitter)

const MIN = -Number.MAX_SAFE_INTEGER
const MAX = Number.MAX_SAFE_INTEGER

function Logoot (site, state, bias) {
  var self = this

  EventEmitter.call(self)

  self.site = site
  self._clock = 0
  self._bias = bias || 15
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

// get random integer in (exclusive) range [a, b] with a linear bias
// Closer to 0 will provide better perfromance when edits are at start of document
// 1 is random allocation strategy
// Above 1 will provide better performance when edits are subsequent (usually the case)
function randomBiasedInt (a, b, bias) {
  return Math.floor(Math.pow(Math.random(), bias) * (b - (a + 1))) + a + 1
}

Logoot.prototype._generateLine = function (prev, next, value) {
  const self = this

  // first, find the common prefix of both position identifiers
  var newPosition = []

  var maxLength = Math.max(prev.pos.ids.length, next.pos.ids.length)

  for (var index = 0; index < maxLength + 1; index++) {
    const prevId = prev.pos.ids[index] || new Identifier(MIN, null)
    const nextId = next.pos.ids[index] || new Identifier(MAX, null)

    const diff = nextId.int - prevId.int

    if (diff > 1) { // enough room for integer between prevInt and nextInt
      newPosition.push(new Identifier(randomBiasedInt(prevId.int, nextId.int, self._bias), self.site))
      break
    } else if (diff === 1 && self.site > prevId.site) { // same, but site offers more room
      newPosition.push(new Identifier(prevId.int, self.site))
      break
    } else { // no room, need to add a new id
      newPosition.push(prevId)
    }
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

Logoot.prototype.length = function () {
  var self = this
  return self._lines.length - 2
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
