class Thing {
  constructor(x,y,start) {
    this.start = start
    this.x = x
    this.y = y

    this.cache = []

  }
}

class Sim {
  constructor() {
    this.tick = 0
    this.things = []
  }

  addThing(x,y) {
    this.things.push(new Thing(x,y, this.tick))
  }

  doTick() {
    for (const thing in things) {
      thing.x += 1
      thing.y += 1
      thing.cache
    }

  }

}
