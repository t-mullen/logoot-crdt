function Identifier (int, site) {
  this.int = int
  this.site = site
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
      return 0
    }
  }
}
module.exports = Identifier
