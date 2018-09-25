# logoot-crdt
Replicate text or sequences over networks.

Allows an unlimited number of authors to collborate on text over networks. Has much better memory performance than [woot-crdt](https://github.com/t-mullen/woot-crdt), at the cost of increased network guarantees (in-order delivery and exactly-once delivery).

Uses the Logoot CRDT algorithm: https://hal.inria.fr/inria-00432368/document

## example
```javascript
var l1 = new Logoot('site1')
var l2 = new Logoot('site1')

// send sync messages between peers
l1.on('operation', (op) => {
  // send through your network (in-order, exactly-once delivery is required)
  l2.receive(op)
})
l2.on('operation', (op) => {
  l1.receive(op)
})

// make concurrent changes
l1.insert('abc', 0)
l2.insert('123', 0)

// the values eventually converge!
l1.value() // 'abc123'
l2.value() // 'abc123'
```

## install
```html
<script src="dist/logoot.js>"></script>
```
or
```
npm install --save logoot-crdt
```

## api
### `var doc = new Logoot(site, [state])`
Create a new synchronized sequence.

- `site` is a globally unique identifer.
- `state` allows you to initialize from an existing sequence state. 

### `doc.insert(value, index)`
Insert a new string.
- `value` is the string value to insert.
- `index` is the position to insert.

### `doc.delete(index, [length])`
Delete characters.
- `index` starting position of deletion.
- `length` number of characters to delete (default is `1`).

### `doc.replaceRange(value, index, length)`
Replace a range of elements with a new string.
- `value` is the string value to insert.
- `index` is the position to insert/delete.
- `length` number of characters to delete before inserting (default is `0`).

### `doc.setValue(value)`
Replaces all text with the given value.
- `value` is the string value to set the text to.

### `doc.getState()`
Returns the current state of the CRDT. Can be passed into the constructor of another sequence to transfer state or into `setState()`.

### `doc.setState(state)`
Sets the current state of the CRDT. Equivalent to constructing a new instance.

Changing the state is unsafe; edits may have been made while you are transfering state that will need to be integrated. The best way to handle this is a two-step sync:

```javascript
var state = l1.getState()
var missedOperations = []
network.on('operation', (op) => {
  l1.receive(op)
  missedOperations.push(op) // save this to send to w2 later
})

// send state to w2 (w2 is not receiving any operations until now)
l2.setState(state)
network.on('operation', op => { // w2 can now receive operations
  l2.receive(op)
})

// then send all the operations w2 missed during sync (don't worry about duplicates)
missedOperations.forEach(op => l2.receive(op))

// both peers are now safely synced
```

### `doc.on('operation', (op) => {})`
This event fires when an operation object needs to be sent to all other synchronized sequences.

### `doc.receive(op)`
Receive an operation object from another sequence.

### `doc.value()`
Get the full string content of the sequence. Useful for initializing the view.

### `doc.on('insert', (event) => {})`
This event fires when a remote insertion has been integrated. Useful for updating the view. Event object looks like:

```javascript
{
  value: 'a', // The character inserted
  index: 0  // The index in the sequence
}
```

### `doc.on('delete', (event) => {})`
This event fires when a remote insertion has been integrated. Useful for updating the view. Event object looks like:

```javascript
{
  value: 'a', // The character deleted
  index: 0  // The index in the sequence where the element was
}
```