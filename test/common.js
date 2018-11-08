const Logoot = require('./../src/index')

// mirror the CRDT with a traditional model via the update events
function wrapWithModel(w) {
  w.externalModel = []
  w.getModel = () => {
    return w.externalModel.join('')
  }
  w.insert = (value, index) => {
    value.split('').forEach((char, i) => {
      w.externalModel.splice(index + i, 0, char)
    })
    Logoot.prototype.insert.call(w, value, index)
    if (w.getModel() !== w.value()) throw new Error('local insert caused model divergence')
  }
  w.delete = (index, length=1) => {
    w.externalModel.splice(index, length)
    Logoot.prototype.delete.call(w, index, length)
    if (w.getModel() !== w.value()) throw new Error('local delete caused model divergence')
  }
  w.on('insert', ({ value, index }) => {
    w.externalModel.splice(index, 0, value)
    if (w.getModel() !== w.value()) throw new Error('remote insert caused model divergence')
  })
  w.on('delete', ({ value, index }) => {
    if (w.getModel()[index] !== value) throw new Error('deleted wrong-valued element')
    w.externalModel.splice(index, 1)
    if (w.getModel() !== w.value()) throw new Error('remote delete caused model divergence')
  })
}

module.exports.makeNodes = function (n) {
  var nodes = []

  for (var i=0; i<n; i++) {
    let w1 = new Logoot('site' + i)
    wrapWithModel(w1)
    nodes.push(w1)
    
    w1.on('operation', function (op) { 
      nodes.forEach(w2 => {
        if (w2.site !== w1.site) {
            w2.receive(JSON.parse(JSON.stringify(op)))
        }
      })
    })
  }
  
  return nodes
}

module.exports.makeNodesWithDelay = function (n) {
  var nodes = []

  for (var i=0; i<n; i++) {
    let w1 = new Logoot('site' + i)
    wrapWithModel(w1)
    w1.queues = {}

    nodes.push(w1)
    w1.on('operation', function (op) { 
      nodes.forEach(w2 => {
        if (w2.site !== w1.site) {
          w1.queues[w2.site] = w1.queues[w2.site] || []
          w1.queues[w2.site].push(op)

          setTimeout(() => {
            w2.receive(w1.queues[w2.site].shift())
          }, Math.random() * 100)
        }
      })
    })
  }
  
  return nodes
}

module.exports.makeNodesWithHoldingQueue =  function (n) {
  var nodes = []

  for (var i=0; i<n; i++) {
    let w1 = new Logoot('site' + i)
    wrapWithModel(w1)
    w1.queues = {}

    w1.receiveAllFrom = function (node) {
      (node.queues[w1.site] || []).forEach(op => {
        w1.receive(op)
      })
      node.queues[w1.site] = []
    }

    nodes.push(w1)
    w1.on('operation', function (op) { 
      nodes.forEach(w2 => {
        if (w2.site !== w1.site) {
          w1.queues[w2.site] = w1.queues[w2.site] || []
          w1.queues[w2.site].push(op)
        }
      })
    })
  }
  
  return nodes
}

module.exports.makeNodesWithDelayedRepeats = function (n) {
  var nodes = []

  for (var i=0; i<n; i++) {
    let w1 = new Logoot('site' + i)
    wrapWithModel(w1)
    w1.queues = {}

    nodes.push(w1)
    w1.on('operation', function (op) { 
      nodes.forEach(w2 => {
        if (w2.site !== w1.site) {
          w1.queues[w2.site] = w1.queues[w2.site] || []
          const repeats = Math.floor(Math.random()*2) + 1
          for (var i=0; i<repeats; i++) {
            w1.queues[w2.site].push(op)
          }
          
          setTimeout(() => {
            for (var i=0; i<repeats; i++) {
              w2.receive(w1.queues[w2.site].shift())
            }
          }, Math.random() * 100)
        }
      })
    })
  }
  
  return nodes
}