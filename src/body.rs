use std::cmp::min;

mod transform;
use transform::Transform;
pub use transform::Transform as BodyTransform;

mod bounds;
use bounds::Bounds;
pub use bounds::Edge as BodyBoundEdge;

use crate::Tick;

/*** Aliases ***/

type ID = u16;
pub type BodyID = ID;

/// A body is an entity in a simulation that is influenced gravitationally
/// by all other bodies in the simulation. They are attracted to one another
/// and accumulate mass by colliding with each other.
///
/// A body also contains a cache of it's transforms during each integration
/// tick so that an arbitrary previous state of a simulation can be visualized.
#[derive(Debug)]
pub struct Body {
    pub transform: Transform,
    bounds: Bounds,

    id: ID,
    start_tick: Tick,
    cache: Vec<Transform>,
}

impl Body {
    /// Creates a body configured to start at tick 0
    pub fn new(id: ID, transform: Transform) -> Body {
        Body::new_at_tick(id, 0, transform)
    }

    /// Creates a body configured to start at a given tick
    pub fn new_at_tick(id: ID, tick: Tick, transform: Transform) -> Body {
        //
        let mut body = Body {
            id,

            start_tick: tick,
            cache: Vec::new(),
            transform,
            bounds: Bounds::new(),
        };

        body.bounds.update(&transform);
        body.record_tick(&tick, transform);
        body
    }

    /// Do the bounds of two bodies overlap one another?
    pub fn bounds_overlap(a: &Body, b: &Body) -> bool {
        Bounds::overlap(&a.bounds, &b.bounds)
    }

    pub fn destroyed(&self) -> bool {
        self.transform.is_destroyed()
    }

    pub fn id(&self) -> &ID {
        &self.id
    }

    pub fn start_tick(&self) -> &Tick {
        &self.start_tick
    }

    pub fn end_tick(&self) -> Tick {
        let cache_length = self.cache.len();
        let cache_offset = if cache_length == 0 {
            0
        } else {
            cache_length - 1
        };

        self.start_tick + cache_offset
    }

    pub fn apply_tick(&mut self, tick: &Tick) -> &Transform {
        let transform_at_tick = self.get_cache_data(tick);

        if &self.transform != transform_at_tick {
            self.transform = *transform_at_tick
        }

        &self.transform
    }

    pub fn record_tick(&mut self, tick: &Tick, transform: Transform) {
        let cache_length = self.cache.len();

        let cache_index = self.get_cache_index(tick);
        if cache_index > cache_length {
            let max_tick = cache_length + self.start_tick;
            panic!(
                "Ticks must be written in consecutive order, {} must be written before {}",
                max_tick, tick
            )
        }

        if cache_length == 0 || cache_index == cache_length {
            self.cache.push(transform)
        } else {
            self.cache[cache_index] = transform
        }
    }

    pub fn record_next_tick(&mut self) {
        let next_tick = self.cache.len() + self.start_tick;
        self.record_tick(&next_tick, self.transform);
    }

    pub fn invalidate_before(&mut self, tick: &Tick) -> bool {
        let inclusive_tick = *tick + 1;

        if inclusive_tick < self.start_tick {
            self.start_tick -= inclusive_tick;
        } else {
            let cache_index: Tick = self.get_cache_index(&inclusive_tick);
            let clamped_cache_index = min(cache_index, self.cache.len());

            self.cache.drain(0..clamped_cache_index);
            self.start_tick = 0;
        };

        let erased_by_invalidation = self.cache.len() == 0;
        erased_by_invalidation
    }

    pub fn invalidate_after(&mut self, tick: &Tick) -> bool {
        let exclusive_tick = *tick;
        // ^ thought about having invalidate_before_inc, invalidate_before_exc,
        // invalidate_after_inc and invalidate_after_exc methods, but figured
        // that might have been over-kill. Decided to make invalidate_before
        // inclusive and invalidate_after exclusive, because that covers all
        // cache-invalidation use cases.

        if exclusive_tick < self.start_tick {
            self.cache.clear();
        } else {
            let final_index = self.get_cache_index(&exclusive_tick);
            self.cache.truncate(final_index);
        }

        let erased_by_invalidation = self.cache.len() == 0;
        erased_by_invalidation
    }

    fn get_cache_index(&self, tick: &Tick) -> usize {
        if tick < &self.start_tick {
            // ^ index would be below zero
            panic!("Body {} did not yet exist at tick {}", self.id, tick)
        }

        let cache_index = tick - self.start_tick;
        cache_index
    }

    fn get_cache_data(&self, tick: &Tick) -> &Transform {
        if tick < &self.start_tick {
            return Transform::destroyed();
        }

        let cache_index = self.get_cache_index(tick);
        if cache_index < self.cache.len() {
            &self.cache[cache_index]
        } else {
            Transform::destroyed()
        }
    }
}

impl PartialEq for Body {
    fn eq(&self, other: &Body) -> bool {
        self.id == other.id
    }
}

/*** Tests ***/

#[cfg(test)]
mod test {

    use super::*;
    use crate::vector::V2;

    #[test]
    fn id() {
        let id: BodyID = 10;
        let body = Body::new(id, Transform::new(100.0, V2::zero(), V2::zero()));

        assert_eq!(body.id(), &id);
    }

    #[test]
    fn start_tick() {
        let id: BodyID = 5;
        let start_tick: Tick = 100;

        let body = Body::new_at_tick(id, start_tick, Transform::new(50.0, V2::zero(), V2::zero()));

        assert_eq!(body.start_tick(), &start_tick);
    }

    #[test]
    fn destroyed() {
        let mut body = Body::new(0, Transform::new(50.0, V2::zero(), V2::zero()));
        assert_eq!(body.destroyed(), false);

        body.transform.mass = 0.0;
        assert_eq!(body.destroyed(), true);
    }

    #[test]
    fn new_at_tick() {
        let id: ID = 10;
        let tick: Tick = 10;

        let transform = Transform::new(10.0, V2::zero(), V2::zero());
        let body = Body::new_at_tick(id, tick, transform);

        assert_eq!(body.id(), &id);
        assert_eq!(body.start_tick(), &tick);
        assert_eq!(body.transform, transform);
    }

    #[test]
    fn record_and_apply_tick() {
        let t1 = Transform::new(10.0, V2::zero(), V2::zero());
        let t2 = Transform::new(10.0, V2::new(0.0, 1.0), V2::zero());

        let mut body = Body::new(0, t1);

        body.record_tick(&1, t2);
        assert_eq!(body.transform, t1);

        body.apply_tick(&1);
        assert_eq!(body.transform, t2);
    }

    #[test]
    fn invalidate_before() {
        const TEST_CACHE_SIZE: usize = 4;
        const FIRST_TICK: Tick = 10;
        const LAST_TICK: Tick = FIRST_TICK + TEST_CACHE_SIZE;
        const TICKS_TO_REMOVE: Tick = 2;

        // cache a bunch of transform
        let mut body =
            Body::new_at_tick(0, FIRST_TICK, Transform::new(10.0, V2::zero(), V2::zero()));

        for _i in 1..TEST_CACHE_SIZE {
            body.transform.position.x += 1.0;
            body.record_next_tick();
        }

        let first_position_after_invalidate = body.cache[TICKS_TO_REMOVE].position;

        let before = FIRST_TICK + (TICKS_TO_REMOVE - 1); // -1 because invalidate_before is inclusive
        let mut was_deleted = body.invalidate_before(&before);

        // check that invalidated transforms are removed
        assert_eq!(body.cache[0].position, first_position_after_invalidate);
        assert_eq!(body.cache.len(), TEST_CACHE_SIZE - TICKS_TO_REMOVE);
        assert_eq!(was_deleted, false);

        // check that cache is cleared if invalidated out of range
        was_deleted = body.invalidate_before(&LAST_TICK);

        assert_eq!(body.cache.len(), 0);
        assert_eq!(was_deleted, true);
    }

    #[test]
    fn invalidate_after() {
        const TEST_CACHE_SIZE: usize = 4;
        const FIRST_TICK: Tick = 10;
        const LAST_TICK: Tick = FIRST_TICK + TEST_CACHE_SIZE;
        const TICKS_TO_REMOVE: Tick = 2;

        // cache a bunch of transforms
        let mut body =
            Body::new_at_tick(0, FIRST_TICK, Transform::new(10.0, V2::zero(), V2::zero()));
        for _i in 1..TEST_CACHE_SIZE {
            body.transform.position.x += 1.0;
            body.record_next_tick();
        }

        let last_position_after_invalidate =
            body.cache[body.cache.len() - (TICKS_TO_REMOVE + 1)].position;

        // check that invalidated transforms are removed
        let after = LAST_TICK - TICKS_TO_REMOVE;

        let mut was_deleted = body.invalidate_after(&after);
        assert_eq!(
            body.cache[body.cache.len() - 1].position,
            last_position_after_invalidate
        );
        assert_eq!(body.cache.len(), TEST_CACHE_SIZE - TICKS_TO_REMOVE);
        assert_eq!(was_deleted, false);

        was_deleted = body.invalidate_after(&FIRST_TICK);
        assert_eq!(body.cache.len(), 0);
        assert_eq!(was_deleted, true);
    }
}
