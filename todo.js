const assert = require('assert')

class Todo {
  constructor (title, due) {
    let obj = {
      completedOn: null
    }

    if (title instanceof Object) {
      Object.assign(obj, title)
    } else {
      obj.title = title
      obj.due = due
    }

    assert(obj.title, 'title required')
    Object.assign(this, obj)

    if (due) {
      this.due = new Date(due)
    }

    if (this.completedOn) {
      this.completedOn = new Date(this.completedOn)
    }

    if (this.snoozed) {
      this.snoozed = new Date(this.snoozed)
    }
  }

  complete (date = new Date()) {
    this.completedOn = date.getUTCFullYear() + '-'
      + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-'
      + ('0' + date.getUTCDate()).slice(-2)
  }
}

module.exports = Todo
