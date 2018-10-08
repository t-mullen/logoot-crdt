function Identifier (int, site, clock) {
  this.int = int
  this.site = site
  this.clock = clock
}
Identifier.prototype.compare = function (other) {
  if (this.int > other.int) {
    return 1
  } else if (this.int < other.int) {
    return -1
  } else {
    if (this.site > other.site) {
      return 1
    } else if (this.site < other.site) {
      return -1
    } else {
      if (this.clock > other.clock) {
        return 1
      } else if (this.clock < other.clock) {
        return -1
      } else {
        return 0
      }
    }
  }
}
module.exports = Identifier
