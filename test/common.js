const Logoot = require('./../src/index')

module.exports.makeNodes = function (n) {
  var nodes = []

  for (var i=0; i<n; i++) {
    let w1 = new Logoot('site' + i)
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