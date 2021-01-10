use crate::{body::BodyID, Simulation};

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

    pub fn tick(&mut self, simulation: &mut Simulation) {
        //
        self.detect_collisions(simulation);
        self.calculate_forces(simulation);
        self.apply_forces(simulation);
    }

    fn detect_collisions(&self, simulation: &mut Simulation) {}

    fn calculate_forces(&self, simulation: &mut Simulation) {}

    fn apply_forces(&self, simulation: &mut Simulation) {
        for body in simulation.get_bodies_mut() {
            //
        }
    }
}
