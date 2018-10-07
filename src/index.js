const EventEmitter = require('nanobus')
const inherits = require('inherits')

const Node = require('./node')
const Identifier = require('./identifier')

inherits(Logoot, EventEmitter)

const MIN = 0
const MAX = Number.MAX_SAFE_INTEGER

function Logoot (site, state, bias) {
  EventEmitter.call(this)

  this.site = site
  this._deleteQueue = []
  this._bias = bias || 15

  Node.compare = (a, b) => { return a.compare(b) }

  this._root = new Node()
  this._root.setEmpty(true)
  this._root.addChild(new Node(new Identifier(MIN, null)))
  this._root.addChild(new Node(new Identifier(MAX, null)))

  if (state) this.setState(state)
}

function parseId (id) {
  if (id) return new Identifier(id.int, id.site)
}
function parseOperation (operation) {
  operation.position = operation.position.map(parseId)
  return operation
}

Logoot.prototype.receive = function (operation) {
  operation = parseOperation(operation)
  if (operation.type === 'insert') {
    const node = this._root.getChildByPath(operation.position)
    node.value = operation.value
    node.setEmpty(false)

    var currentQueue = this._deleteQueue
    this._deleteQueue = []
    currentQueue.forEach((op) => {
      this.receive(op)
    })
  } else {
    const node = this._root.getChildByPath(operation.position, false)
    if (node) {
      node.setEmpty(true)
      node.trimEmpty()
    } else {
      this._deleteQueue.push(operation)
    }
  }
}

Logoot.prototype.insert = function (value, index) {
  value.split('').forEach((character, i) => {
    this._insert(character, index + i)
  })
}

Logoot.prototype._insert = function (value, index) {
  index = Math.min(index, this.length())

  const prev = this._root.getChildByOrder(index)
  const next = this._root.getChildByOrder(index + 1)

  if (!prev) {
    console.log(value, index, this.length())
  }

  const position = this._generatePositionBetween(prev, next, value)
  this.emit('operation', { type: 'insert', position, value })
}

function randomBiasedInt (a, b, bias) {
  return Math.floor(Math.pow(Math.random(), bias) * (b - (a + 1))) + a + 1
}

Logoot.prototype._generatePositionBetween = function (prev, next, value) {
  const prevPos = prev.getPath()
  const nextPos = next.getPath()
  const newPos = []

  const maxLength = Math.max(prevPos.length, nextPos.length)

  for (var depth = 0; depth < maxLength + 1; depth++) {
    const prevId = prevPos[depth] || new Identifier(MIN, null)
    const nextId = nextPos[depth] || new Identifier(MAX, null)

    const diff = nextId.int - prevId.int

    if (diff > 1) { // enough room for integer between prevInt and nextInt
      const id = new Identifier(randomBiasedInt(prevId.int, nextId.int, this._bias), this.site)
      newPos.push(id)
      break
    } else if (diff === 1 && this.site > prevId.site) { // same, but site offers more room
      const id = new Identifier(prevId.int, this.site)
      newPos.push(id)
      break
    } else { // no room, need to search/build next level
      newPos.push(prevId)
    }
  }

  const node = this._root.getChildByPath(newPos)
  node.value = value
  node.setEmpty(false)

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
