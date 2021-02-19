use std::collections::HashMap;

use crate::body::{Body, BodyID};

/*** Aliases ***/

/// Integrator takes a collection of bodies and performs manipulation
#[derive(Debug)]
pub struct Integrator<'a> {
    bodies: HashMap<BodyID, &'a Body>,
}

impl<'a> Integrator<'a> {
    //
    pub fn new() -> Integrator<'a> {
        Integrator {
            bodies: HashMap::new(),
        }
    }

    pub fn sync_bodies(&mut self, bodies: &mut HashMap<BodyID, Body>) {
        for (id, body) in bodies {
            //
        }
        //
    }

    pub fn tick(&mut self) {
        //
        self.detect_collisions();
        self.calculate_forces();
        self.apply_forces();
    }

    //
    fn detect_collisions(&self) {}

    //
    fn calculate_forces(&self) {}

    //
    fn apply_forces(&self) {}
}

/*** Tests ***/

#[cfg(test)]
mod test {}
