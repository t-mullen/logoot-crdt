var test = require('tape')

var Logoot = require('./../src/index')

function makeNodes (n) {
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

function makeNodesWithDelay (n) {
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

test('single inserter', function (t) {
  var nodes = makeNodes(1)

  var w1 = nodes[0] 
  
  w1.insert('abc', 0)
  w1.insert('123', 0)
  
  t.equals(w1.value(), '123abc')
  
  t.end()
})

test('test insert', function (t) {
  var nodes = makeNodes(2)

  var w1 = nodes[0] 
  var w2 = nodes[1] 
  
  w1.insert('abc', 0)
  w2.insert('xyz', 0)
  w1.insert('123', 1)
  w2.insert('m', 4)
  w2.insert('f', w2.value().length)
  
  t.equals(w1.value(), w2.value())
  t.equals(w1.value(), 'x123myzabcf')
  
  t.end()
})

test('test delete', function (t) {
  var nodes = makeNodes(2)

  var w1 = nodes[0] 
  var w2 = nodes[1] 
  
  w1.insert('abcdefg', 0)
  w2.delete(2)
  w1.delete(1, 3)
  w1.delete(0)
  w1.delete(2)
  w2.delete(w2.value().length - 1)
  
  t.equals(w1.value(), w2.value())
  t.equals(w1.value(), 'f')
  
  t.end()
})

test('test replaceRange', function (t) {
  var nodes = makeNodes(2)

  var w1 = nodes[0] 
  var w2 = nodes[1] 
  
  w1.replaceRange('abcdefg', 0, 0)
  w2.replaceRange('xyz', 0, 3)
  w1.replaceRange('123', 5, 0)
  w1.replaceRange('456', 6, 2)
  w2.replaceRange('x', w2.value().length, 0)
  w2.replaceRange('y', w2.value().length - 1, 1)

  t.equals(w1.value(), w2.value())
  t.equals(w1.value(), 'xyzde1456fgy')
  
  t.end()
})

test('test setValue', function (t) {
  var nodes = makeNodes(2)

  var w1 = nodes[0] 
  var w2 = nodes[1] 
  
  w1.insert('abc', 0)
  w2.setValue('abc')
  
  t.equals(w1.value(), w2.value())
  t.equals(w1.value(), 'abc')
  
  t.end()
})

function getRandomMethod () {
  var methods = ['insert', 'delete', 'replaceRange']
  return methods[Math.floor(Math.random() * methods.length)]
}

function getRandomArguments (method) {
  switch (method) {
    case 'insert':
      return [Math.random().toString(), Math.floor(Math.random() * 100)]
      break;
    case 'delete':
      return [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)]
      break;
    case 'replaceRange':
      return [Math.random().toString(), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)]
      break;
  }
}

test('test randomized operations n=2', function (t) {
  var nodes = makeNodes(2)
  var rounds = 50

  for (var i=0; i<rounds; i++) {
    nodes.forEach(node => {
      var method = getRandomMethod()
      node[method].apply(node, getRandomArguments(method))
    })
  }

  var finalValue = nodes[0].value()
  t.assert(!nodes.some(node => node.value() !== finalValue), 'all nodes converged')
  t.end()
})

test('test randomized operations with delay n=2', function (t) {
  t.plan(1)

  var nodes = makeNodesWithDelay(2)
  var rounds = 50

  for (var i=0; i<rounds; i++) {
    nodes.forEach(node => {
      var method = getRandomMethod()
      node[method].apply(node, getRandomArguments(method))
    })
  }

  setTimeout(() => {
    var finalValue = nodes[0].value()
    t.assert(!nodes.some(node => node.value() !== finalValue), 'all nodes converged')
    t.end()
  }, 1000)
})

test('test randomized operations n=10', function (t) {
  var nodes = makeNodes(10)
  var rounds = 5

  for (var i=0; i<rounds; i++) {
    nodes.forEach(node => {
      var method = getRandomMethod()
      node[method].apply(node, getRandomArguments(method))
    })
  }

  var finalValue = nodes[0].value()
  t.assert(!nodes.some(node => node.value() !== finalValue), 'all nodes converged')
  t.end()
})

test('test randomized operations with delay n=10', function (t) {
  t.plan(1)

  var nodes = makeNodesWithDelay(10)
  var rounds = 5

  for (var i=0; i<rounds; i++) {
    nodes.forEach(node => {
      var method = getRandomMethod()
      node[method].apply(node, getRandomArguments(method))
    })
  }

  setTimeout(() => {
    var finalValue = nodes[0].value()
    t.assert(!nodes.some(node => node.value() !== finalValue), 'all nodes converged')
    t.end()
  }, 1000)
})

test('state transfer', function (t) {
  var nodes = makeNodes(2)

  var w1 = nodes[0] 
  var w2 = nodes[1] 
  
  w1.insert('abc', 0)
  w2.delete(0, 2)
  w1.insert('123', 1)
  w2.replaceRange('m', 0, 2)

  t.equals(w1.value(), w2.value())

  // new node joins
  var w3 = new Logoot('site3', w1.getState())
  w3.on('operation', (op) => {
    w2.receive(op)
    w1.receive(op)
  })
  w1.on('operation', (op) => {
    w3.receive(op)
  })
  w2.on('operation', (op) => {
    w3.receive(op)
  })

  w1.insert('x', 1)
  w2.insert('y', 1)
  w3.insert('z', 1)

  t.equals(w1.value(), w2.value())
  t.equals(w1.value(), w3.value())
  
  t.end()
})


test('test left-to-right edit performance', function (t) {
  var w1 = new Logoot('site1')

  var IDCount = 0
  var totalIDLength = 0
  w1.on('operation', (op) => {
    IDCount++
    totalIDLength += op.line.pos.ids.length
  })
  
  for (var i=0; i < 10000; i++) {
    w1.insert('a', i)
  }

  console.log('Average identifier length:', totalIDLength / IDCount)
  t.end()
})

test('test random edit performance', function (t) {
  var w1 = new Logoot('site1')

  var IDCount = 0
  var totalIDLength = 0
  w1.on('operation', (op) => {
    IDCount++
    totalIDLength += op.line.pos.ids.length
  })

  for (var i=0; i < 1000; i++) {
    w1.insert('a', Math.floor(w1.length() * Math.random()))
  }

  console.log('Average identifier length:', totalIDLength / IDCount)
  t.end()
})

test('test mixed edit performance', function (t) {
  var w1 = new Logoot('site1')

  var IDCount = 0
  var totalIDLength = 0
  w1.on('operation', (op) => {
    IDCount++
    totalIDLength += op.line.pos.ids.length
  })

  for (var i=0; i < 500; i++) {
    w1.insert('a', i)
    w1.insert('a', Math.floor(w1.length() * Math.random()))
  }

  console.log('Average identifier length:', totalIDLength / IDCount)
  t.end()
})
