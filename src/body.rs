use crate::{ vector::V2 };

// Aliases 
pub type Tick = usize;

pub type BodyMass = f32;
pub type BodyID = u16;

// Constants 
const RADIUS_MIN: f32 = 1.0; 
const RADIUS_FACTOR: f32 = 0.125; 
const MASS_MIN: f32 = 1.0;
const DESTROYED_BODY_Data: BodyData = BodyData {
    position: V2 { x: 0.0, y: 0.0 },
    velocity: V2 { x: 0.0, y: 0.0 },
    mass: 0.0,
    parent_id: None
};

// Body Tick Data
#[derive(Debug, PartialEq, Copy, Clone)]
pub struct BodyData {
    pub position: V2,
    pub velocity: V2,
    pub mass: BodyMass,
    pub parent_id: Option<BodyID>,
}

// Body 
#[derive(Debug)]
pub struct Body {

    id: BodyID,
    start_tick: Tick,

    cache: Vec<BodyData>
}

impl Body {

    pub fn new (id: BodyID, data: BodyData) -> Body {
        Body::new_at_tick(id, 0, data)
    }

    pub fn new_at_tick (id: BodyID, tick: Tick, data: BodyData) -> Body {

        let mut body = Body {
            id,
            start_tick: tick,
            cache: Vec::new()
        };

        body.record_tick(&tick, data);
        body
    }

    pub fn id (&self) -> &BodyID {
        &self.id
    }

    pub fn get_start_tick (&self) -> &Tick {
        &self.start_tick
    }

    pub fn record_tick (&mut self, tick: &Tick, data: BodyData) {

        let cache_index = self.get_cache_index(tick);
        if cache_index > self.cache.len() {
            let max_tick = self.start_tick + cache_index;
            panic!(
                "Ticks must be recorded continoglously. Tick {} cannot be recorded until {} has.", 
                tick, 
                max_tick
            )
        };

        self.cache[cache_index] = data;
    }

    fn get_cache_index (&self, tick: &Tick) -> usize {

        if self.start_tick > *tick {
            // ^ index would be below zero
            panic!("Body {} did not yet exist at tick {}", self.id, tick)
        }

        let cache_index = tick - self.start_tick;
        cache_index
    }

    fn get_cache_data (&self, tick: &Tick) -> &BodyData {

        let cache_index = self.get_cache_index(tick);
        if cache_index < self.cache.len() {
            &self.cache[cache_index]
        } else {
            &DESTROYED_BODY_Data
        }
    }

    pub fn mass (&self, tick: &Tick) -> &BodyMass {
        &self.get_cache_data(tick).mass
    }

    pub fn position (&self, tick: &Tick) -> &V2 {
        &self.get_cache_data(tick).position
    }

    pub fn velocity (&self, tick: &Tick) -> &V2 {
        &self.get_cache_data(tick).velocity
    }

    pub fn parent_id (&self, tick: &Tick) -> &Option<BodyID> {
        &self.get_cache_data(tick).parent_id
    }

    pub fn radius (&self, tick: &Tick) -> BodyMass {
        RADIUS_MIN + self.mass(tick).cbrt() - MASS_MIN * RADIUS_FACTOR
    }

    pub fn destroyed (&self, tick: &Tick) -> bool {
        *self.mass(tick) <= 0.0
    }
}

impl PartialEq for Body {
    fn eq (&self, other: &Body) -> bool {
        self.id == other.id        
    }
}

#[cfg(test)]
mod test {

}