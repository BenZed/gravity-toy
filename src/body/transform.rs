use crate::vector::*;
use std::f64::NAN;

/*** Aliases ***/

pub type Mass = f32;

/*** Constants ***/

pub const MASS_MIN: Mass = 1.0;

const RADIUS_FACTOR: f32 = 0.125;
const RADIUS_MIN: f32 = 1.0;

const DESTROYED_BODY_TRANSFORM: Transform = Transform {
    position: V2 { x: NAN, y: NAN },
    velocity: V2 { x: NAN, y: NAN },
    mass: 0.0,
};

/// The mass and coordinates of a Body. Instances of this
/// data structure are used by the body as it's current
/// transformation and in the body's cache to represent
/// it's changes over time.
#[derive(Debug, PartialEq, Copy, Clone)]
pub struct Transform {
    pub position: V2,
    pub velocity: V2,
    pub mass: Mass,
}

impl Transform {
    pub fn new(mass: Mass, position: V2, velocity: V2) -> Transform {
        if mass < MASS_MIN {
            panic!(
                "Mass of new transforms cannot be below {}. Use Transform::destroyed() instead.",
                MASS_MIN
            )
        }

        Transform {
            mass,
            position,
            velocity,
        }
    }

    /// A representation of a body transform that has been destroyed, either
    /// because it collided into a larger body, or the simulation is visualizing
    /// a tick where the body did not yet exist.
    pub fn destroyed() -> &'static Transform {
        &DESTROYED_BODY_TRANSFORM
    }

    pub fn radius(&self) -> Mass {
        if self.is_destroyed() {
            0.0
        } else {
            RADIUS_MIN + self.mass.cbrt() - MASS_MIN * RADIUS_FACTOR
        }
    }

    pub fn is_destroyed(&self) -> bool {
        self.mass < MASS_MIN
    }
}

/*** Tests ***/

#[cfg(test)]
mod test {

    use super::*;

    #[test]
    #[should_panic]
    fn new() {
        Transform::new(
            0.0, // <- mass must be above 0.0
            V2::zero(),
            V2::zero(),
        );
    }

    #[test]
    fn destroyed() {
        let destroyed_transform = Transform::destroyed();

        assert_eq!(destroyed_transform.mass, 0.0);
        assert!(destroyed_transform.position.x.is_nan());
        assert!(destroyed_transform.position.y.is_nan());
        assert!(destroyed_transform.velocity.x.is_nan());
        assert!(destroyed_transform.velocity.y.is_nan());
    }

    #[test]
    fn is_destroyed() {
        let destroyed_transform = Transform::destroyed();
        assert_eq!(destroyed_transform.is_destroyed(), true);

        let transform = Transform::new(10.0, V2::zero(), V2::zero());
        assert_eq!(transform.is_destroyed(), false);
    }

    #[test]
    fn radius() {
        let transform = Transform::new(10.0, V2::zero(), V2::zero());
        assert_ne!(transform.radius(), 0.0);

        let destroyed_transform = Transform::destroyed();
        assert_eq!(destroyed_transform.radius(), 0.0);
    }
}
