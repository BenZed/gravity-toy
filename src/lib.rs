
use std::collections::HashMap;

mod vector;
use vector::V2;

mod body;
use body::{Body, BodyTransform, BodyID, Tick};

/****************************************************/
// Simulation
/****************************************************/

#[derive(Debug)]
pub struct Simulation {

    next_body_id: body::BodyID,
    bodies: HashMap<BodyID, Body>,
    g: f32,

    tick: Tick
}

impl Simulation {

    pub fn new (g: f32) -> Simulation {

        if g < 0.0 {
            panic!("g cannot be below zero.")
        }

        Simulation {
            g,
            next_body_id: 0,
            bodies: HashMap::new(),
            tick: 0
        }
    }

    pub fn create_body(&mut self, mass: f32, position: V2, velocity: V2) -> &Body {

        let id = self.next_body_id;

        let body = Body::new(
            id,
            BodyTransform::new(
                mass,
                position,
                velocity
            )
        );

        self.bodies.insert(
            id, 
            body
        );

        self.next_body_id += 1;

        &self.bodies[&id]
    }

    pub fn get_tick(&self) -> &Tick {
        &self.tick
    }

    pub fn set_tick(&mut self, tick: &Tick) {
        for body in self.bodies.values_mut() {
            body.read_tick(tick);
        }

        self.tick = *tick;
    }

    pub fn invalidate_before (&mut self, tick: &Tick) {
        self.invalidate(tick, true);

        if &self.tick < tick {
            self.set_tick(tick)
        }
    }

    pub fn invalidate_after (&mut self, tick: &Tick) {
        self.invalidate(tick, false);

        if &self.tick >= tick {
            self.set_tick(tick)
        }
    }

    fn invalidate(&mut self, tick: &Tick, before: bool) {
        
        let mut erased_ids: Vec<BodyID> = Vec::new(); 

        for body in self.bodies.values_mut() {
            
            let erased_by_invalidation = if before {
                body.invalidate_before(tick)
            } else {
                body.invalidate_after(tick)
            };

            if erased_by_invalidation {
                erased_ids.push(*body.id());
            }
        }

        for erased_id in erased_ids {
            self.bodies.remove(&erased_id);
        }
    }
}

/****************************************************/
// Tests
/****************************************************/

#[cfg(test)]
mod test {

    use super::*;

    #[test]
    fn create_body()  {

        let mut sim = Simulation::new(1.0);

        let body = sim.create_body(
            70.0, 
            V2::zero(), 
            V2::zero()
        );

        let body_id = *body.id();

        assert!(sim.bodies.contains_key(&body_id));
        assert!(sim.bodies.len() == 1);
    }

}