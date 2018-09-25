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
