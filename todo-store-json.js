const fs = require('fs')
const Store = require('./store')
const Todo = require('./todo')
const assert = require('assert')
const uuidv4 = require('uuid/v4')

class JSONStore extends Store {
  constructor (filepath = './data.json') {
    super()

    this.filepath = filepath
    this.todosCache = []
    this.ready = this.loadJSON()
  }

  loadJSON () {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filepath, (err, data) => {
        if (err) {
          reject(Error('Loading JSON file failed', err))
          return
        }

        // Process file
        data = JSON.parse(data.toString('utf8'))
        this.todosCache = data.map((todo) => new Todo(todo))

        resolve()
      })
    })
  }

  get (id) {
    if (id) {
      // Get one
      let result = this.todosCache.filter((todo) => todo.id === id)
      assert(result.length, 'No todo found')
      return result[0]
    } else {
      // Get all
      return this.todosCache
    }
  }

  putProcessing (todo) {
    assert(todo instanceof Todo)
    if (todo.id) {
      // Update
      let cachedTodo = this.get(todo.id)
      assert.ok(cachedTodo, 'Put todo has an ID but is not found : ID ' + todo.id)
      Object.assign(cachedTodo, todo)
    } else {
      // Create
      todo.id = uuidv4()
      this.todosCache.push(todo)
    }
  }

  put (todo) {
    this.putProcessing(todo)
    return this.commit()
  }

  move (srcs, dest) {
    let newCache = [...this.todosCache]

    // Remove existing
    let hydratedSrcs = []
    for (let id of srcs) {
      for (let i = newCache.length - 1; i >= 0; i--) {
        let other = newCache[i]
        if (other.id !== id) {
          continue
        }

        newCache.splice(i, 1)[0]
        hydratedSrcs.push(other)
      }
    }

    let moveIndex = -1
    for (let i = 0; i < newCache.length; i++) {
      let other = newCache[i]
      if (other.id === dest) {
        moveIndex = i
        break
      }
    }

    if (moveIndex >= 0) {
      // Add in
      newCache.splice(moveIndex, 0, ...hydratedSrcs)
      this.todosCache = newCache
    } else {
      return Promise.reject('Move id not found')
    }

    return this.commit()
  }

  commit (data = this.todosCache) {
    return new Promise ((resolve, reject) => {
      fs.writeFile(this.filepath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
          reject(Error('Committing todo data failed', err))
          return
        }

        resolve()
      })
    })
  }
}

module.exports = JSONStore
