use std::collections::HashMap;

use crate::body::{Body, BodyID};

/****************************************************/
// Alias
/****************************************************/

type Bodies = HashMap<BodyID, Body>;
/****************************************************/
// Main
/****************************************************/

//
#[derive(Debug)]
pub struct Integrator {
    body_ids: Vec<BodyID>,
    destroyed_body_ids: Vec<BodyID>,
}

impl Integrator {
    //
    pub fn new() -> Integrator {
        Integrator {
            body_ids: vec![],
            destroyed_body_ids: vec![],
        }
    }

    pub fn tick(&mut self, bodies: &Bodies) {
        //
        self.refresh_bounds(bodies);
        self.collision_detection(bodies);
        self.calculate_forces(bodies);
        self.apply_forces(bodies);
    }

    fn refresh_bounds(&self, bodies: &Bodies) {
        for body in bodies {
            //
        }
    }

    fn collision_detection(&self, bodies: &Bodies) {
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
