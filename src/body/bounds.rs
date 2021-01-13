use std::cmp::Ordering;
use std::f64::{INFINITY, NEG_INFINITY};

use super::transform::Transform;

/*** Traits ***/

trait Refreshable {
    fn refresh(&mut self, radius: &f32, transform: &Transform);
}

/*** Enums ***/

#[derive(Debug, PartialEq, Clone, Copy)]
enum EdgeAxis {
    X,
    Y,
}

#[derive(Debug, PartialEq, Clone, Copy)]
enum EdgeLimit {
    Min,
    Max,
}

/// Edge of a bound.
///
/// Q: What a wierd way to define an edge. Why not two V2's? To save
///    memory?
///
/// A: In order to make collision detection performant, we need to have
///    a sorted list of edges by axis. And sure, this also saves memory.
#[derive(Debug, PartialEq, Clone, Copy)]
struct Edge {
    value: f64,
    axis: EdgeAxis,
    limit: EdgeLimit,
}

impl Edge {
    fn new(axis: EdgeAxis, limit: EdgeLimit) -> Edge {
        let value = match limit {
            EdgeLimit::Min => NEG_INFINITY,
            EdgeLimit::Max => INFINITY,
        };

        Edge { axis, limit, value }
    }
}

impl PartialOrd for Edge {
    fn partial_cmp(&self, other: &Edge) -> Option<Ordering> {
        self.value.partial_cmp(&other.value)
    }
}

impl Refreshable for Edge {
    fn refresh(&mut self, radius: &f32, transform: &Transform) {
        let velocity;
        let position;
        let mut radius = *radius as f64;
        let mut shift = 0.0;

        match self.axis {
            EdgeAxis::X => {
                velocity = transform.velocity.x;
                position = transform.position.x;
            }
            EdgeAxis::Y => {
                velocity = transform.velocity.y;
                position = transform.position.y;
            }
        };

        match self.limit {
            EdgeLimit::Min => {
                radius = -radius;
                if velocity > 0.0 {
                    shift = -velocity;
                }
            }
            EdgeLimit::Max => {
                if velocity < 0.0 {
                    shift = -velocity;
                }
            }
        }

        self.value = position + radius + shift;
    }
}

/// Bounding box of a body.
#[derive(Debug, PartialEq, Clone, Copy)]
pub struct Bounds {
    left: Edge,
    right: Edge,
    top: Edge,
    bottom: Edge,
}

impl Bounds {
    pub fn new() -> Bounds {
        use EdgeAxis::{X, Y};
        use EdgeLimit::{Max, Min};

        Bounds {
            left: Edge::new(X, Min),
            right: Edge::new(X, Max),
            top: Edge::new(Y, Min),
            bottom: Edge::new(Y, Max),
        }
    }

    /// Do two sets of bounds overlap?
    pub fn overlap(a: &Self, b: &Self) -> bool {
        if a.left > b.right || b.left > a.right {
            return false;
        }

        if a.left > b.bottom || b.top > a.bottom {
            return false;
        }

        true
    }
}

impl Refreshable for Bounds {
    fn refresh(&mut self, radius: &f32, transform: &Transform) {
        self.left.refresh(radius, transform);
        self.right.refresh(radius, transform);
        self.top.refresh(radius, transform);
        self.bottom.refresh(radius, transform);
    }
}

/*** Tests ***/

#[cfg(test)]
mod test {}
