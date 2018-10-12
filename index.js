const express = require('express')
const JSONStore = require('./todo-store-json')
const Todo = require('./todo')

const app = express()
const port = 3000

const store = new JSONStore()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/todos', (req, res) => {
  let todos = store.get()

  let now = new Date()
  todos = todos.filter((todo) => !todo.completedOn &&
      (!todo.snoozed || todo.snoozed.getTime() <= now.getTime()))

  res.status(200).send(todos)
})
app.post('/todos', (req, res) => {
  let { title, due, move } = req.body

  store.put(new Todo(title, due), move)
    .then(() => {
      res.status(200).send()
    })
})
app.post('/todos/done/:id', (req, res) => {
  let id = req.body.id || req.params.id

  let current = store.get(id)
  current.complete()
  store.put(current)
    .then(() => {
      res.status(200).send('done')
    })
})
app.post('/todos/move', (req, res) => {
  let src = req.body.src || req.params.src
  let dest = req.body.dest || req.params.dest

  // Ensure array
  if (!(src instanceof Array)) {
    src = [src]
  }

  store.move(src, dest).then(() => res.status(200).send())
})

function snooze (srcs, when) {
  // Ensure array
  if (!(srcs instanceof Array)) {
    srcs = [srcs]
  }

  // Someday
  if (!when) {
    when = '9999-12-30 23:59:59'
  }

  when = new Date(when)
  return Promise.all(srcs.map((id) => {
    let todo = store.get(id)
    todo.snoozed = todo.snoozed || when
    return store.put(todo)
  }))
}

app.post('/todos/snooze', (req, res) => {
  let srcs = req.body.srcs || req.params.src
  let when = req.body.when || req.params.when

  snooze(srcs, when).then(() => res.status(200).send())
})
app.post('/todos/focus/:id', (req, res) => {
  let id = req.body.id || req.params.id

  let focusTodo = store.get(id)
  let srcs = store.get().filter((todo) => todo !== focusTodo)
    .map((todo) => todo.id)
  snooze(srcs)
    .then(() => {
      focusTodo.snoozed = null
      return store.put(focusTodo)
    })
    .then(() => res.status(200).send())
})

app.listen(port, () => console.log(`Focus Service listening on port ${port}`))
