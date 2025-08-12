use wasm_bindgen::prelude::*;
use rand::Rng;
use serde::Serialize;
use serde_wasm_bindgen::to_value as to_js_value;

fn generate_secret(max: u32) -> u32 {
    let mut rng = rand::thread_rng();
    rng.gen_range(1..=max)
}

#[derive(Serialize)]
struct GuessResponse<'a> {
    result: &'a str, // "low" | "high" | "correct"
    attempts: u32,
}

#[wasm_bindgen]
pub struct Game {
    secret: u32,
    max: u32,
    attempts: u32,
    finished: bool,
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new(max: Option<u32>) -> Game {
        let max_bound = max.unwrap_or(100).max(1);
        Game {
            secret: generate_secret(max_bound),
            max: max_bound,
            attempts: 0,
            finished: false,
        }
    }

    /// Resets the game. If a new max is provided, updates the range.
    pub fn reset(&mut self, max: Option<u32>) {
        if let Some(m) = max {
            self.max = m.max(1);
        }
        self.secret = generate_secret(self.max);
        self.attempts = 0;
        self.finished = false;
    }

    /// Makes a guess and returns a structured result as a JS object.
    /// Throws a JS exception if the guess is out of range.
    pub fn guess(&mut self, value: u32) -> JsValue {
        if value < 1 || value > self.max {
            wasm_bindgen::throw_str("Guess out of range");
        }

        if self.finished {
            let resp = GuessResponse { result: "correct", attempts: self.attempts };
            return to_js_value(&resp).expect("serialize GuessResponse");
        }

        self.attempts = self.attempts.saturating_add(1);

        let result = if value < self.secret {
            "low"
        } else if value > self.secret {
            "high"
        } else {
            self.finished = true;
            "correct"
        };

        let resp = GuessResponse { result, attempts: self.attempts };
        to_js_value(&resp).expect("serialize GuessResponse")
    }

    /// Returns the current attempt count.
    pub fn get_attempts(&self) -> u32 { self.attempts }

    /// Returns the current max bound.
    pub fn get_max(&self) -> u32 { self.max }
}

// Optional: basic unit tests for logic (non-WASM)
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn secret_within_bounds() {
        for max in [1u32, 2, 10, 100, 500] {
            let s = generate_secret(max);
            assert!(s >= 1 && s <= max);
        }
    }
}


