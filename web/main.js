import init, { Game } from "../pkg/guess_number_wasm.js";

const dom = {
  max: document.getElementById("max"),
  applyRange: document.getElementById("apply-range"),
  guess: document.getElementById("guess"),
  submit: document.getElementById("submit"),
  restart: document.getElementById("restart"),
  feedback: document.getElementById("feedback"),
  attempts: document.getElementById("attempts"),
};

function setFeedback(text, type) {
  dom.feedback.textContent = text;
  dom.feedback.className = type || "";
}

function setDisabled(disabled) {
  dom.submit.disabled = disabled;
  dom.guess.disabled = disabled;
}

let game;

async function bootstrap() {
  try {
    await init();
    const max = Number(dom.max.value) || 100;
    game = new Game(max);
    dom.attempts.textContent = String(game.get_attempts());
    setFeedback("Game ready.");
  } catch (e) {
    setFeedback("Failed to initialize WASM. Refresh to retry.", "error");
    console.error(e);
  }
}

dom.applyRange.addEventListener("click", () => {
  const max = Number(dom.max.value);
  if (!Number.isFinite(max) || max < 1) {
    setFeedback("Max must be a positive integer.", "error");
    return;
  }
  try {
    game.reset(max);
    dom.attempts.textContent = String(game.get_attempts());
    dom.guess.value = "";
    setFeedback(`Range set to 1..${game.get_max()}. New secret generated.`);
    setDisabled(false);
  } catch (e) {
    setFeedback("Failed to reset game.", "error");
    console.error(e);
  }
});

function handleGuess() {
  const value = Number(dom.guess.value);
  if (!Number.isFinite(value)) {
    setFeedback("Please enter a valid number.", "error");
    return;
  }
  try {
    const res = game.guess(value);
    const { result, attempts } = res;
    dom.attempts.textContent = String(attempts);
    if (result === "low") setFeedback("Too Low");
    else if (result === "high") setFeedback("Too High");
    else if (result === "correct") {
      setFeedback("Correct!", "success");
      setDisabled(true);
    }
  } catch (e) {
    setFeedback(e?.message || "Guess out of range", "error");
  }
}

dom.submit.addEventListener("click", handleGuess);
dom.guess.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleGuess();
});

dom.restart.addEventListener("click", () => {
  try {
    game.reset();
    dom.attempts.textContent = String(game.get_attempts());
    dom.guess.value = "";
    setFeedback("Game restarted. New secret set.");
    setDisabled(false);
  } catch (e) {
    setFeedback("Failed to restart.", "error");
    console.error(e);
  }
});

bootstrap();


