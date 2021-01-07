mod transform;
use transform::{Transform};

pub use transform::Transform as BodyTransform;

/****************************************************/
// Aliases
/****************************************************/

pub type BodyID = u16;
pub type Tick = usize;

/****************************************************/
// Body
/****************************************************/

#[derive(Debug)]
pub struct Body {

    pub transform: Transform,

    id: BodyID,
    start_tick: Tick,
    cache: Vec<Transform>
}

impl Body {

    pub fn new (id: BodyID, transform: Transform) -> Body {
        Body::new_at_tick(id, 0, transform)
    }

    pub fn new_at_tick (id: BodyID, tick: Tick, transform: Transform) -> Body {

        let mut body = Body {
            id,
            
            start_tick: tick,
            cache: Vec::new(),
            transform: transform,
        };

        body.record_tick(&tick, transform);
        body
    }

    pub fn destroyed (&self) -> bool {
        self.transform.is_destroyed()
    }

    pub fn id (&self) -> &BodyID {
        &self.id
    }

    pub fn start_tick (&self) -> &Tick {
        &self.start_tick
    }

    pub fn apply_tick(&mut self, tick: &Tick) -> &Transform {

        let transform_at_tick= self.get_cache_data(tick); 
        
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
                max_tick,
                tick
            )
        }

        if cache_length == 0 || cache_index == cache_length - 1 {
            self.cache.push(transform)
        } else {
            self.cache[cache_index] = transform
        }
    }

    pub fn record_next_tick (&mut self) {
        let next_tick = self.cache.len() + self.start_tick;
        self.record_tick(&next_tick, self.transform);
    }

    pub fn invalidate_before (&mut self, tick: &Tick) -> bool {

        if tick < &self.start_tick {
            self.start_tick -= tick;

        } else {
            self.start_tick = 0;
            
            let mut num_ticks_to_remove = tick - self.start_tick;
            while num_ticks_to_remove > 0 && self.cache.len() > 0 {
                self.cache.remove(0);
                num_ticks_to_remove -= 1;
            }
        };

        let erased_by_invalidation = self.cache.len() == 0;
        erased_by_invalidation
    }

    pub fn invalidate_after (&mut self, tick: &Tick) -> bool {

        if tick <= &self.start_tick {
            self.cache.clear();
        
        } else {
            let final_index = self.get_cache_index(tick);
            self.cache.truncate(final_index);
        }

        let erased_by_invalidation = self.cache.len() == 0;
        erased_by_invalidation
    }

    fn get_cache_index (&self, tick: &Tick) -> usize {

        if tick < &self.start_tick {
            // ^ index would be below zero
            panic!("Body {} did not yet exist at tick {}", self.id, tick)
        }

        let cache_index = tick - self.start_tick;
        cache_index
    }

    fn get_cache_data (&self, tick: &Tick) -> &Transform {

        if tick < &self.start_tick {
            return Transform::destroyed()
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

    fn eq (&self, other: &Body) -> bool {
        self.id == other.id        
    }

}

/****************************************************/
// Tests
/****************************************************/

#[cfg(test)]
mod test {
}