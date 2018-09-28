function Position (ids, site, clock) {
  this.ids = ids
  this.site = site
  this.clock = clock
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
    return -1
  } else {
    if (self.site > other.site) {
      return 1
    } else if (self.site < other.site) {
      return -1
    } else {
      if (self.clock > other.clock) {
        return 1
      } else if (self.clock < other.clock) {
        return -1
      } else {
        return 0
      }
    }
  }
}

module.exports = Position
