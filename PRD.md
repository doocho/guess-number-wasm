## Product Requirements Document (PRD): Guess-the-Number (Rust + WASM)

### 1. Overview
A lightweight, client‑side number guessing game. The secret number is generated in Rust using secure randomness, compiled to WebAssembly (WASM). The browser UI captures user input and dispatches events into the WASM module. WASM synchronously responds with feedback that the UI renders ("Too Low", "Too High", or "Correct").

This project is primarily for learning: how browser events call into WASM functions, and how WASM responds back to the browser.

### 2. Goals
- **Learning WASM interop**: Demonstrate browser → WASM calls and WASM → browser responses.
- **Secure randomness**: Use the browser’s Web Crypto via Rust to generate the secret number.
- **Simple, accessible UI**: Minimal page with input, feedback, attempt counter, and restart.
- **Fully client‑side**: No server or network calls; everything runs in the browser.

### 3. Non‑Goals
- Multiplayer, persistence, or backend integration.
- Localization beyond English.
- Advanced game modes (timers, scoring leaderboards, etc.).

### 4. Target Platforms
- Desktop browsers: latest Chrome, Firefox, Safari, Edge.
- Mobile browsers (best effort): recent iOS Safari and Android Chrome.

### 5. User Stories
- As a player, I can start a game with a chosen range (default 1–100) so I know the bounds.
- As a player, I can input a guess and immediately see if it’s too low, too high, or correct.
- As a player, I can see how many attempts I’ve made.
- As a player, I can restart the game at any time and optionally change the range.
- As a player, I get clear validation and error messages for invalid input.

### 6. UX Requirements
- **Layout**: Range selector (min, max or just max), numeric input, "Guess" button, feedback text, attempt counter, and "Restart" button.
- **Validation**: Disable "Guess" if input is empty or out of range. Show inline errors.
- **Feedback**: Display one of: "Too Low", "Too High", "Correct!". On correct guess, highlight success and disable further guessing until restart.
- **Accessibility**: Semantic HTML, labels for inputs, keyboard focus states, aria-live region for feedback so screen readers announce responses.

### 7. Architecture
- **Frontend (JS/TS + minimal HTML/CSS)**: Renders UI, handles DOM events, calls WASM APIs via `wasm-bindgen` generated glue. Updates UI with WASM responses.
- **WASM (Rust)**: Holds game state and logic. Exposes a `Game` class with methods for starting/resetting and making guesses. Uses secure randomness from Web Crypto.
- **Data flow**:
  - Browser event (e.g., click "Guess") → call `game.guess(value)` in WASM.
  - WASM returns a structured result → UI updates feedback and attempts.

### 8. Technical Requirements
- **Rust crates**:
  - `wasm-bindgen` for JS bindings.
  - `rand` for uniform integer generation.
  - `getrandom` with the `js` feature to source randomness from Web Crypto in the browser.
- **Build tooling**:
  - Compile to `wasm32-unknown-unknown`.
  - Use `wasm-pack` for bundling and generating JS bindings.
  - Use Vite (or similar) for a simple dev server and bundling the frontend.
- **Module init**: Load and initialize the WASM module on page load; create a `Game` instance.
- **Error handling**: Convert Rust errors to JS exceptions or structured return values; no uncaught panics in production.

### 9. WASM API (JS‑Facing)
Expose a `Game` class using `#[wasm_bindgen]`:

- `constructor(max: number = 100)`
  - Creates a new game with range `1..=max`. Generates a new secret using secure randomness. Resets attempts to 0.

- `reset(max?: number)`
  - Resets the game and optionally changes the range to a new `max` (default: keep current). Generates a new secret and sets attempts to 0.

- `guess(value: number) -> { result: "low" | "high" | "correct", attempts: number }`
  - Increments attempts and compares `value` to the secret. Returns structured feedback.
  - If `value` is out of range, throw a JS exception or return `{ result: "error" }` (MVP: throw with a clear message; UI catches and displays it).

- `get_attempts() -> number`
  - Returns current attempt count.

- `get_max() -> number`
  - Returns current upper bound.

Notes:
- Prefer structured return values (via `JsValue`/serde) to simplify UI updates.
- Keep a single `Game` instance for the page (no multi‑instance management required for MVP).

### 10. Randomness Strategy
- Use `rand` with `getrandom` (feature `js`) so randomness is sourced from the browser’s `crypto.getRandomValues`, ensuring unbiased, secure generation.
- Generate the secret uniformly in `1..=max`.

### 11. Frontend Integration (TS/JS)
- Initialize WASM module on DOMContentLoaded.
- Bind UI events:
  - Range change → call `game.reset(newMax)` and clear feedback.
  - Click or Enter on input → call `game.guess(value)`; update feedback and attempt counter.
  - Restart → call `game.reset()`; clear input and feedback.
- Handle exceptions from WASM (e.g., invalid input/out‑of‑range) and show inline error text.

### 12. Error States
- Non‑numeric input → UI validation; block call to `guess`.
- Out‑of‑range input → either UI prevents it or WASM throws; UI displays message.
- WASM init failure (network/caching issue) → show a retry banner and instructions.

### 13. Performance & Size
- WASM module loads in under ~300ms on a typical broadband connection for target browsers.
- Keep bundle small; avoid heavy dependencies beyond `wasm-bindgen`, `rand`, `getrandom`.

### 14. Security & Privacy
- No network requests; no PII.
- All randomness via Web Crypto.
- Avoid `panic!` that could leak stack traces to UI; map to friendly messages.

### 15. Testing
- **Rust unit tests**: Secret generation bounds, guess comparison logic, attempts increment.
- **WASM tests**: Use `wasm-bindgen-test` for basic interop and API shape.
- **Manual QA**: Cross‑browser checks for UI behavior, accessibility (keyboard/screen reader), and error handling.

### 16. Milestones
1) Scaffold Rust crate, add dependencies, build to WASM, serve a hello‑world page.
2) Implement `Game` struct and logic in Rust; expose with `wasm-bindgen`.
3) Wire up basic HTML/TS UI to call `Game` methods and render responses.
4) Add validations, accessibility (aria‑live), and polished feedback states.
5) Add tests and finalize docs.

### 17. Acceptance Criteria
- On load, the WASM module initializes and a `Game` instance is created.
- Player can set a max range, make guesses, and see immediate feedback.
- "Correct" state disables further guesses until restart.
- Attempt counter increments correctly and resets on restart.
- Randomness is sourced from Web Crypto (verified by dependency configuration and runtime behavior).
- Works on latest Chrome, Firefox, Safari, and Edge.

### 18. Risks & Mitigations
- Browser differences in WASM/ESM loading → use `wasm-pack` + Vite tested template.
- Randomness sourcing misconfigured → explicitly enable `getrandom/js` feature; add a smoke test.
- Type marshaling issues (enums) → return simple objects/strings from WASM.

### 19. Open Questions
- Should out‑of‑range guesses throw or return a structured error result? (MVP: throw; UI handles.)
- Do we need a lower bound other than 1? (MVP: fixed at 1.)


