use std::fmt::{Display, Formatter, Result};
use std::ops::{Add, AddAssign, Div, DivAssign, Mul, MulAssign, Sub, SubAssign};

#[derive(PartialEq, Copy, Clone, Debug)]
pub struct V2 {
    pub x: f64,
    pub y: f64,
}

impl V2 {
    pub fn new(x: f64, y: f64) -> V2 {
        V2 { x, y }
    }

    pub fn zero() -> V2 {
        V2 { x: 0.0, y: 0.0 }
    }

    pub fn dist(left: &V2, right: &V2) -> f64 {
        (*left - *right).mag()
    }

    pub fn sqr_dist(left: &V2, right: &V2) -> f64 {
        (*left - *right).sqr_mag()
    }

    pub fn dot(left: &V2, right: &V2) -> f64 {
        let left = left.normalize();
        let right = right.normalize();

        left.x * right.x + left.y * right.y
    }

    pub fn mag(&self) -> f64 {
        self.sqr_mag().sqrt()
    }

    pub fn sqr_mag(&self) -> f64 {
        (self.x * self.x) + (self.y * self.y)
    }

    pub fn lerp(&self, target: &V2, delta: f64) -> V2 {
        V2::new(
            self.x + delta * (target.x - self.x),
            self.y + delta * (target.y - self.y),
        )
    }

    pub fn normalize(&self) -> V2 {
        let mag = self.mag();
        if mag == 0.0 {
            V2::zero()
        } else {
            V2::new(self.x / mag, self.y / mag)
        }
    }

    pub fn rotate(&self, degrees: f64) -> V2 {
        let radians = degrees.to_radians();
        let cos = radians.cos();
        let sin = radians.sin();

        V2::new(self.x * cos - self.y * sin, self.x * sin - self.y * cos)
    }

    pub fn angle(&self) -> f64 {
        self.y.atan2(self.x).to_degrees()
    }
}

/*** Display Implementation ***/

impl Display for V2 {
    fn fmt(&self, v2: &mut Formatter<'_>) -> Result {
        write!(v2, "V2({}, {})", self.x, self.y)
    }
}

/*** Operator Overloading ***/

impl Add<V2> for V2 {
    type Output = V2;

    fn add(self, other: V2) -> V2 {
        V2::new(self.x + other.x, self.y + other.y)
    }
}

impl AddAssign<V2> for V2 {
    fn add_assign(&mut self, other: V2) {
        self.x += other.x;
        self.y += other.y;
    }
}

impl Sub<V2> for V2 {
    type Output = V2;

    fn sub(self, other: V2) -> V2 {
        V2::new(self.x - other.x, self.y - other.y)
    }
}

impl SubAssign<V2> for V2 {
    fn sub_assign(&mut self, other: V2) {
        self.x -= other.x;
        self.y -= other.y;
    }
}

impl Mul<V2> for V2 {
    type Output = V2;

    fn mul(self, other: V2) -> V2 {
        V2::new(self.x * other.x, self.y * other.y)
    }
}

impl Mul<f64> for V2 {
    type Output = V2;

    fn mul(self, other: f64) -> V2 {
        V2::new(self.x * other, self.y * other)
    }
}

impl MulAssign<V2> for V2 {
    fn mul_assign(&mut self, other: V2) {
        self.x *= other.x;
        self.y *= other.y;
    }
}

impl MulAssign<f64> for V2 {
    fn mul_assign(&mut self, other: f64) {
        self.x *= other;
        self.y *= other;
    }
}

impl Div<V2> for V2 {
    type Output = V2;

    fn div(self, other: V2) -> V2 {
        V2::new(self.x / other.x, self.y / other.y)
    }
}

impl Div<f64> for V2 {
    type Output = V2;

    fn div(self, other: f64) -> V2 {
        V2::new(self.x / other, self.y / other)
    }
}

impl DivAssign<V2> for V2 {
    fn div_assign(&mut self, other: V2) {
        self.x /= other.x;
        self.y /= other.y;
    }
}

impl DivAssign<f64> for V2 {
    fn div_assign(&mut self, other: f64) {
        self.x /= other;
        self.y /= other;
    }
}

/*** Tests ***/

#[cfg(test)]
mod test {

    use super::*;

    #[test]
    fn new() {
        let v2 = V2::new(1.0, 1.0);

        assert_eq!(v2.x, 1.0);
        assert_eq!(v2.y, 1.0);
    }

    #[test]
    fn zero() {
        let v2 = V2::zero();

        assert_eq!(v2.x, 0.0);
        assert_eq!(v2.y, 0.0);
    }

    #[test]
    fn dist() {
        let left = V2::new(5.0, 0.0);
        let right = V2::new(-5.0, 0.0);

        assert_eq!(V2::dist(&left, &right), 10.0);
        assert_eq!(V2::dist(&right, &left), 10.0);

        assert_eq!(V2::sqr_dist(&left, &right), 100.0);
        assert_eq!(V2::sqr_dist(&right, &left), 100.0);
    }

    #[test]
    fn dot() {
        let left = V2::new(5.0, 0.0);
        let right = V2::new(0.0, 5.0);

        assert_eq!(V2::dot(&left, &right), 0.0);
        assert_eq!(V2::dot(&left, &left), 1.0);
    }

    #[test]
    fn lerp() {
        let from = V2::new(1.0, 1.0);
        let to = V2::new(4.0, 4.0);

        assert_eq!(from.lerp(&to, 0.0), V2::new(1.0, 1.0));
        assert_eq!(from.lerp(&to, 0.5), V2::new(2.5, 2.5));
        assert_eq!(from.lerp(&to, 1.0), V2::new(4.0, 4.0))
    }

    #[test]
    fn mag() {
        assert_eq!(V2::new(5.0, 0.0).mag(), 5.0);
        assert_eq!(V2::new(5.0, 0.0).sqr_mag(), 5.0 * 5.0);
    }

    #[test]
    fn normalize() {
        let big = V2::new(5.0, 0.0);
        assert_eq!(big.normalize(), V2::new(1.0, 0.0));

        let small = V2::new(0.0, 0.5);
        assert_eq!(small.normalize(), V2::new(0.0, 1.0));
    }

    #[test]
    fn rotate() {
        let left = V2::new(1.0, 0.0);
        let up = V2::new(0.0, 1.0);

        assert_eq!(left.rotate(90.0).y, up.y);
        // can't do:
        //
        // assert_eq!(left.rotate(90.0), up)
        //
        // because float point precision errors
        // result in an obscurely small x value.
    }

    #[test]
    fn angle() {
        let v2 = V2::new(0.0, 1.0);
        assert_eq!(v2.angle(), 90.0);
    }

    #[test]
    fn add() {
        let left = V2::new(0.0, 1.0);
        let right = V2::new(1.0, 0.0);

        let mut added = left + right;
        assert_eq!(added, V2 { x: 1.0, y: 1.0 });

        added += V2 { x: 1.0, y: 1.0 };
        assert_eq!(added, V2 { x: 2.0, y: 2.0 })
    }

    #[test]
    fn sub() {
        let left = V2::new(2.0, 2.0);
        let right = V2::new(1.0, 1.0);

        let mut subbed = left - right;
        assert_eq!(subbed, V2 { x: 1.0, y: 1.0 });

        subbed -= V2 { x: 1.0, y: 1.0 };
        assert_eq!(subbed, V2::zero());
    }

    #[test]
    fn mul() {
        let left = V2::new(2.0, 2.0);
        let right = V2::new(2.0, 2.0);

        let mut mult = left * right;
        assert_eq!(mult, V2::new(4.0, 4.0));

        mult *= V2::new(0.5, 0.5);
        assert_eq!(mult, V2::new(2.0, 2.0));
    }

    #[test]
    fn mul_scalar() {
        let mut left = V2::new(1.0, 1.0);
        assert_eq!(left * 2.0, V2::new(2.0, 2.0));

        left *= 5.0;
        assert_eq!(left, V2::new(5.0, 5.0));
    }

    #[test]
    fn div() {
        let left = V2::new(2.0, 2.0);
        let right = V2::new(2.0, 2.0);

        let mut div = left / right;
        assert_eq!(div, V2::new(1.0, 1.0));

        div /= V2::new(0.5, 0.5);
        assert_eq!(div, V2::new(2.0, 2.0));
    }

    #[test]
    fn div_scalar() {
        let mut left = V2::new(4.0, 4.0);
        assert_eq!(left / 2.0, V2::new(2.0, 2.0));

        left /= 2.0;
        assert_eq!(left, V2::new(2.0, 2.0));
    }
}
