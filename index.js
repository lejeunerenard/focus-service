const express = require('express')
const JSONStore = require('./todo-store-json')
const Todo = require('./todo')

const app = express()
const port = 3000

const store = new JSONStore()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

function currentFilter (now = new Date()) {
  return (todo) => !todo.completedOn &&
    (!todo.snoozed || todo.snoozed.getTime() <= now.getTime())
}

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/todos', (req, res) => {
  let todos = store.get()

  todos = todos.filter(currentFilter())

  res.status(200).send(todos)
})
app.post('/todos', (req, res) => {
  let { title, due, move } = req.body

  store.put(new Todo(title, due), move)
    .then(() => {
      res.status(200).send()
    })
})
app.post('/todos/done', (req, res) => {
  let ids = req.body.ids

  // Ensure array
  if (!(ids instanceof Array)) {
    ids = ids ? [ids] : []
  }

  // Default to topmost to-do
  if (ids.length === 0) {
    ids.push(store.get().filter(currentFilter())[0].id)
  }

  Promise.all(ids.map((id) => {
    let current = store.get(id)
    current.complete()
    return store.put(current)
  }))
    .then(() => {
      res.status(200).send('done')
    })
})
app.post('/todos/move', (req, res) => {
  let { srcs, dest } = req.body

  // Ensure array
  if (!(srcs instanceof Array)) {
    srcs = srcs ? [srcs] : []
  }

  store.move(srcs, dest).then(() => res.status(200).send())
})

function snooze (srcs, when) {
  // Ensure array
  if (!(srcs instanceof Array)) {
    srcs = srcs ? [srcs] : []
  }

  // Someday
  if (!when) {
    when = '9999-12-30 23:59:59'
  }

  when = new Date(when)
  return Promise.all(srcs.map((id) => {
    let todo = store.get(id)
    todo.snoozed = when
    return store.put(todo)
  }))
}

app.post('/todos/snooze', (req, res) => {
  let { srcs, when } = req.body
  // Ensure array
  if (!(srcs instanceof Array)) {
    srcs = srcs ? [srcs] : []
  }

  // Default to topmost to-do
  if (srcs.length === 0) {
    srcs.push(store.get().filter(currentFilter())[0].id)
  }

  snooze(srcs, when).then(() => res.status(200).send())
})
app.post('/todos/focus', (req, res) => {
  let ids = req.body.ids

  // Ensure array
  if (!(ids instanceof Array)) {
    ids = ids ? [ids] : []
  }

  // Default to topmost to-do
  if (ids.length === 0) {
    ids.push(store.get().filter(currentFilter())[0].id)
  }

  let focusTodos = ids.map((id) => store.get(id))
  let srcs = store.get()
    .filter(currentFilter())
    .filter((todo) => focusTodos.indexOf(todo) === -1)
    .map((todo) => todo.id)
  snooze(srcs)
    .then(() => {
      return Promise.all(focusTodos.map((focusTodo) => {
        focusTodo.snoozed = null
        return store.put(focusTodo)
      }))
    })
    .then(() => res.status(200).send())
})

app.listen(port, () => console.log(`Focus Service listening on port ${port}`))
