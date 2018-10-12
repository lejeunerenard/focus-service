const assert = require('assert')
const Todo = require('./todo')

class Store {
  get (id) {
    assert.fail('get() not implemented')
  }

  put (todo) {
    assert(todo instanceof Todo)
    assert.fail('put() not implemented')
  }

  move (srcs, dest) {
    assert(srcs instanceof Array)
    assert.fail('move() not implemented')
  }
}

module.exports = Store
