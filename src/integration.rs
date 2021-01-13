use std::collections::HashMap;

use crate::body::{Body, BodyID};

/*** Aliases ***/

type Bodies = HashMap<BodyID, Body>;

/// Integrator takes a collection of bodies and performs manipulation
#[derive(Debug)]
pub struct Integrator {}

impl Integrator {
    //
    pub fn new() -> Integrator {
        Integrator {}
    }

    pub fn tick(&mut self, bodies: &Bodies) {
        //
        self.detect_collisions(bodies);
        self.calculate_forces(bodies);
        self.apply_forces(bodies);
    }

    fn detect_collisions(&self, bodies: &Bodies) {
        for body in bodies {
            //
        }
    }

    fn calculate_forces(&self, bodies: &Bodies) {
        for body in bodies {
            //
        }
    }

    fn apply_forces(&self, bodies: &Bodies) {
        for body in bodies {
            //
        }
    }
}

/*** Tests ***/

#[cfg(test)]
mod test {}
