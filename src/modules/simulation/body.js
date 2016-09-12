import { EventEmitter } from 'events'

export class Body extends EventEmitter {

  static collide(b1, b2) {
    const [big, small] = b1.mass >= b2.mass ? [b1,b2] : [b2,b1]

    small.destroyed = true
    small.emit('collision', big)
    big.emit('colliision', small)

    small.emit('collision-perished', big)
    big.emit('collision-survived', small)

    const totalMass = big.mass + small.mass

    big.pos.x = (big.pos.x * big.mass + small.pos.x * small.mass) / totalMass
    big.pos.y = (big.pos.y * big.mass + small.pos.y * small.mass) / totalMass
    big.vel.x = (big.vel.x * big.mass + small.vel.x * small.mass) / totalMass
    big.vel.y = (big.vel.y * big.mass + small.vel.y * small.mass) / totalMass

  }

}
