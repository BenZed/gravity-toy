use std::collections::{
    hash_map::{Values, ValuesMut},
    HashMap,
};

mod vector;
pub use vector::V2;

mod body;
use body::{Body, BodyID, BodyTransform};

mod integration;
use integration::Integrator;

/*** Constants ***/
const DEFAULT_GRAVITY: f32 = 9.8;

/*** Aliases ***/
pub type Tick = usize;

/*** Simulation ***/
#[derive(Debug)]
pub struct Simulation {
    next_body_id: BodyID,
    bodies: HashMap<BodyID, Body>,

    g: f32,

    tick: Tick,
    integrator: Integrator,
}

impl Simulation {
    pub fn new() -> Simulation {
        Simulation::new_with_gravity(DEFAULT_GRAVITY)
    }

    // Creates a new simulation with a custom gravity coefficient.
    pub fn new_with_gravity(g: f32) -> Simulation {
        if g < 0.0 {
            panic!("g cannot be below zero.")
        }

        Simulation {
            g,
            next_body_id: 0,
            bodies: HashMap::new(),
            tick: 0,
            integrator: Integrator::new(),
        }
    }

    /*** Gravity Interface ***/

    pub fn gravity(&self) -> &f32 {
        &self.g
    }

    /*** Body Interface ***/

    pub fn create_body(&mut self, mass: f32, position: V2, velocity: V2) -> &Body {
        match self.get_next_unused_body_id() {
            //
            Ok(id) => {
                let body = Body::new(id, BodyTransform::new(mass, position, velocity));

                self.bodies.insert(id, body);
                &self.bodies[&id]
            }

            Err(max_bodies) => panic!("Simulation cannot contain more than {} bodies", max_bodies),
        }
    }

    pub fn body(&self, id: &BodyID) -> Option<&Body> {
        self.bodies.get(id)
    }

    pub fn body_mut(&mut self, id: &BodyID) -> Option<&mut Body> {
        self.bodies.get_mut(id)
    }

    pub fn has_body(&self, id: &BodyID) -> bool {
        if let None = self.bodies.get(id) {
            false
        } else {
            true
        }
    }

    pub fn bodies(&self) -> Values<BodyID, Body> {
        self.bodies.values()
    }

    pub fn bodies_mut(&mut self) -> ValuesMut<BodyID, Body> {
        self.bodies.values_mut()
    }

    pub fn num_bodies(&self) -> usize {
        self.bodies.len()
    }

    fn get_next_unused_body_id(&mut self) -> Result<BodyID, usize> {
        const MAX_POSSIBLE_BODIES: usize = (BodyID::max_value() as usize) + 1;

        if self.bodies.len() >= MAX_POSSIBLE_BODIES {
            return Err(MAX_POSSIBLE_BODIES);
        }

        while self.bodies.contains_key(&self.next_body_id) {
            if self.next_body_id == BodyID::max_value() {
                self.next_body_id = 0;
            } else {
                self.next_body_id += 1;
            }
        }

        Ok(self.next_body_id)
    }

    /*** Tick Interface ***/

    /// Gets the tick currently visualized by the simulation.
    pub fn get_tick(&self) -> &Tick {
        &self.tick
    }

    /// Sets the tick currently being visualized by te simulation.
    /// All bodies in the simulation will apply the transformation
    /// that was integrated at the provided tick.
    pub fn set_tick(&mut self, tick: &Tick) {
        for body in self.bodies_mut() {
            body.apply_tick(tick);
        }

        self.tick = *tick;
    }

    /// Remove all cached transforms in all bodies including and
    /// before the specified tick.
    pub fn invalidate_before(&mut self, tick: &Tick) {
        self.invalidate(tick, true);

        if &self.tick <= tick {
            self.set_tick(tick)
        }
    }

    /// Remove all cached transforms in all bodies after the
    /// specified tick.
    pub fn invalidate_after(&mut self, tick: &Tick) {
        self.invalidate(tick, false);

        if &self.tick > tick {
            self.set_tick(tick)
        }
    }

    fn invalidate(&mut self, tick: &Tick, before: bool) {
        let mut erased_ids: Vec<BodyID> = Vec::new();

        for body in self.bodies_mut() {
            let erased_by_invalidation = if before {
                body.invalidate_before(tick)
            } else {
                body.invalidate_after(tick)
            };

            if erased_by_invalidation {
                erased_ids.push(*body.id());
            }
        }

        for erased_id in erased_ids.iter() {
            self.bodies.remove(erased_id);
        }
    }

    /*** Simulate Interface ***/

    /// Update the transform of all bodies in the simulation by checking for
    /// collisions and applying gravitational forces.
    pub fn integrate(&mut self) {
        self.integrator.tick(&self.bodies);

        for body in self.bodies_mut() {
            body.record_next_tick()
        }
    }
}

/*** Tests ***/

#[cfg(test)]
mod test {

    use super::*;

    #[test]
    fn new_default() {
        let sim = Simulation::new();
        assert_eq!(*sim.gravity(), DEFAULT_GRAVITY);
    }

    #[test]
    fn create_body() {
        let mut sim = Simulation::new();
        let body_id1 = *sim.create_body(70.0, V2::zero(), V2::zero()).id();

        assert!(sim.bodies.contains_key(&body_id1));
        assert_eq!(sim.bodies.len(), 1);

        let body_id2 = *sim.create_body(50.0, V2::zero(), V2::zero()).id();
        assert_ne!(body_id1, body_id2);

        assert!(sim.bodies.contains_key(&body_id2));
        assert_eq!(sim.bodies.len(), 2);
    }

    #[test]
    fn get_body() {
        let mut sim = Simulation::new();

        let body1_id = *sim.create_body(50.0, V2::zero(), V2::zero()).id();

        if let Some(body1) = sim.body(&body1_id) {
            assert_eq!(*body1.id(), body1_id);
        } else {
            panic!("get_body did not get Body with id {}", body1_id)
        }
    }

    #[test]
    fn has_body() {
        let mut sim = Simulation::new();

        let body1_id = *sim.create_body(100.0, V2::zero(), V2::zero()).id();
        assert!(sim.has_body(&body1_id));

        let bad_id: BodyID = 1337;
        assert!(!sim.has_body(&bad_id));
    }

    #[test]
    fn num_bodies() {
        let mut sim = Simulation::new();
        assert_eq!(sim.num_bodies(), 0);

        sim.create_body(100.0, V2::zero(), V2::zero());
        assert_eq!(sim.num_bodies(), 1);
    }
}
