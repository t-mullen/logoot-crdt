const EventEmitter = require('nanobus')
const inherits = require('inherits')

const Node = require('./node')
const Identifier = require('./identifier')

inherits(Logoot, EventEmitter)

const MIN = 0
const MAX = Number.MAX_SAFE_INTEGER
const BASE = Math.pow(2, 8)

function Logoot (site, state, bias) {
  EventEmitter.call(this)

  this.site = site
  this.clock = 0
  this._deleteQueue = []
  this._bias = bias || 15

  Node.compare = (a, b) => { return a.compare(b) }

  this._root = new Node()
  this._root.setEmpty(true)
  this._root.addChild(new Node(new Identifier(MIN, null, null)))
  this._root.addChild(new Node(new Identifier(BASE, null, null)))

  if (state) this.setState(state)
}

function parseId (id) {
  if (id) return new Identifier(id.int, id.site, id.clock)
}
function parseOperation (operation) {
  operation.parsed = true
  operation.position = operation.position.map(parseId)
  return operation
}
function arePositionsEqual (a, b) {
  if (a.length !== b.length) return false
  return !a.some((id, index) => {
    return id.compare(b[index]) !== 0
  })
}

Logoot.prototype.receive = function (operation) {
  if (!operation.parsed) operation = parseOperation(operation)
  if (operation.type === 'insert') {
    const deleteQueueIndex = this._deleteQueue.findIndex(op => {
      return arePositionsEqual(op.position, operation.position)
    })
    if (deleteQueueIndex > -1) {
      this._deleteQueue.splice(deleteQueueIndex, 1)
      return
    }

    const node = this._root.getChildByPath(operation.position)
    node.value = operation.value
    node.setEmpty(false)
  } else if (operation.type === 'delete') {
    const node = this._root.getChildByPath(operation.position, false)
    if (node) {
      node.setEmpty(true)
      node.trimEmpty()
    } else {
      if (!this._deleteQueue.some(op => {
        return arePositionsEqual(op.position, operation.position)
      })) {
        this._deleteQueue.push(operation)
      }
    }
  }
}

Logoot.prototype.insert = function (value, index) {
  value.split('').forEach((character, i) => {
    this._insert(character, index + i)
  })
}

function isAtEndOfBlock (node) {
  const index = node.parent._exactSearch(node)
  const rightSibling = node.parent.children[index + 1]
  return !rightSibling || rightSibling.id.site !== node.id.site
}

function isAtStartOfBlock (node) {
  const index = node.parent._exactSearch(node)
  const leftSibling = node.parent.children[index - 1]
  return !leftSibling || leftSibling.id.site !== node.id.site
}

Logoot.prototype._insert = function (value, index) {
  index = Math.min(index, this.length())

  const prev = this._root.getChildByOrder(index)
  const next = this._root.getChildByOrder(index + 1)

  const prevPos = prev.getPath()
  const nextPos = next.getPath()

  var position
  if (prev.id.site === this.site && prev.id.int + 1 < doubledBase(prevPos.length - 1) && isAtEndOfBlock(prev)) {
    position = prevPos.slice(0, -1)
    position.push(new Identifier(prev.id.int + 1, this.site, this.clock++))
  } else if (next.id.site === this.site && next.id.int - 1 > MIN && isAtStartOfBlock(next)) {
    position = nextPos.slice(0, -1)
    position.push(new Identifier(next.id.int - 1, this.site, this.clock++))
  } else {
    position = this._generatePositionBetween(prevPos, nextPos, value)
  }

  const node = this._root.getChildByPath(position)
  node.value = value
  node.setEmpty(false)

  this.emit('operation', { type: 'insert', position, value })
}

function randomBiasedInt (a, b, bias) {
  return Math.floor(Math.pow(Math.random(), bias) * (b - (a + 1))) + a + 1
}
function randomStrat (bias) {
  return Math.random() > 0.5 ? bias : 1 / bias
}
function doubledBase (depth) {
  return Math.min(BASE * Math.pow(2, depth), MAX)
}

Logoot.prototype._generatePositionBetween = function (prevPos, nextPos, value) {
  const newPos = []

  const maxLength = Math.max(prevPos.length, nextPos.length)

  for (var depth = 0; depth < maxLength + 1; depth++) {
    const DEPTH_MAX = doubledBase(depth)
    const prevId = prevPos[depth] || new Identifier(MIN, null, null)
    const nextId = nextPos[depth] || new Identifier(DEPTH_MAX, null, null) // base doubling

    const diff = nextId.int - prevId.int

    if (diff > 1) { // enough room for integer between prevInt and nextInt
      const int = randomBiasedInt(prevId.int, nextId.int, randomStrat(this._bias))
      const id = new Identifier(int, this.site, this.clock++)
      newPos.push(id)
      break
    } else if (this.site > prevId.site) { // same, but site offers more room
      const id = new Identifier(prevId.int, this.site, this.clock++)
      newPos.push(id)
      break
    } else { // no room, need to search/build next level
      newPos.push(prevId)
    }
  }

  // push offset
  const DEPTH_MAX = doubledBase(depth)
  newPos.push(new Identifier(Math.floor((DEPTH_MAX + MIN) / 2), this.site, this.clock++))

  return newPos
}

Logoot.prototype.delete = function (index, length = 1) {
  for (var i = 0; i < length; i++) {
    this._delete(index)
  }
}

Logoot.prototype._delete = function (index) {
  const node = this._root.getChildByOrder(index + 1)
  if (!node || node.id.site == null) return

  const position = node.getPath()
  node.setEmpty(true)
  node.trimEmpty()
  this.emit('operation', { type: 'delete', position })
}

// construct a string from the sequence
Logoot.prototype.value = function () {
  const arr = []
  this._root.walk(node => {
    if (!node.empty) arr.push(node.value)
  })
  return arr.join('')
}

Logoot.prototype.length = function () {
  return this._root.size - 2
}

Logoot.prototype.replaceRange = function (value, start, length) {
  this.delete(start, length)
  this.insert(value, start)
}

Logoot.prototype.setValue = function (value) {
  this.replaceRange(value, 0, this.length())
}

Logoot.prototype.getState = function () {
  return JSON.stringify({
    root: this._root,
    deleteQueue: this._deleteQueue
  }, (key, value) => key === 'parent' ? undefined : value)
}

Logoot.prototype.setState = function (state) {
  const parsed = JSON.parse(state)

  function parseNode (n, parent) {
    const node = new Node(parseId(n.id), n.value)
    node.parent = parent
    node.children = n.children.map(c => parseNode(c, node))
    node.size = n.size
    node.empty = n.empty
    return node
  }

  this._root = parseNode(parsed.root, null)
  this._deleteQueue = parsed.deleteQueue
}

module.exports = Logoot
