// ============================================
// KIDSS1Y7S - GUESS THE ANIMAL
// Correct-answer celebrations + wrong-answer emoji
// ============================================

const $ = (id) => document.getElementById(id);

const ANIMAL_NAMES = [
  "ant", "bee", "buffalo", "butterfly", "cat",
  "cow", "crab", "dog", "donkey", "elephant",
  "fox", "giraffe", "goat", "hen", "horse",
  "jellyfish", "lion", "monkey", "mongoose",
  "octopus", "pigeon", "rabbit", "rat", "rooster",
  "shark", "snake", "sparrow", "squirrel",
  "starfish", "tiger", "whale", "zebra"
];

const TOTAL_QUESTIONS = 10;
const MAX_LIVES = 3;
const POINTS = 10;

let animals = [];
let questions = [];
let questionIndex = 0;
let score = 0;
let lives = MAX_LIVES;
let bestScore = 0;
let locked = false;
let celebrationTimers = [];

// Start the game
document.addEventListener("DOMContentLoaded", initGame);

async function initGame() {
  try {
    bestScore =
      Number(localStorage.getItem("kids1y7sBestScore")) || 0;
  } catch (error) {
    bestScore = 0;
  }

  setupButtons();
  updateBestScore();

  const startButton = $("startButton");
  if (startButton) startButton.disabled = true;

  await loadAnimalImages();

  if (startButton) {
    startButton.disabled = animals.length < 4;
  }

  showScreen("start");

  showMessage(
    animals.length >= 4
      ? "Ready to play? Let's learn about animals! 🐾"
      : "Animal pictures not found. Check your images folder."
  );
}

function setupButtons() {
  const startButton = $("startButton");
  const answerArea = $("answerButtons");
  const playAgainButton = $("playAgainButton");
  const homeButton = $("homeButton");

  if (startButton) {
    startButton.addEventListener("click", startGame);
  }

  if (answerArea) {
    answerArea.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-answer]");

      if (!button || locked || button.disabled) return;

      checkAnswer(button.dataset.answer);
    });
  }

  if (playAgainButton) {
    playAgainButton.addEventListener("click", startGame);
  }

  if (homeButton) {
    homeButton.addEventListener("click", goHome);
  }
}

// Load animal pictures from images folder
function loadAnimalImages() {
  const checks = ANIMAL_NAMES.map((name) => {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          name,
          src: "./images/" + name + ".png"
        });
      };

      img.onerror = () => resolve(null);
      img.src = "./images/" + name + ".png";
    });
  });

  return Promise.all(checks).then((results) => {
    animals = results.filter(Boolean);
    console.log("Animal images loaded:", animals.length);
  });
}

function showScreen(name) {
  const screens = {
    start: $("startScreen"),
    game: $("gameScreen"),
    over: $("gameOverScreen")
  };

  Object.values(screens).forEach((screen) => {
    if (screen) screen.classList.add("hidden");
  });

  if (screens[name]) {
    screens[name].classList.remove("hidden");
  }
}

function showMessage(message) {
  const element = $("gameMessage");
  if (element) element.textContent = message;
}

function startGame() {
  clearCelebrations();

  if (animals.length < 4) {
    showMessage("Please check your animal PNG images.");
    return;
  }

  score = 0;
  lives = MAX_LIVES;
  questionIndex = 0;
  locked = false;

  questions = shuffleArray(animals).slice(
    0,
    Math.min(TOTAL_QUESTIONS, animals.length)
  );

  updateScore();
  updateLives();
  updateLevel();
  updateProgress();

  showScreen("game");
  showQuestion();
}

function showQuestion() {
  locked = false;

  if (questionIndex >= questions.length || lives <= 0) {
    endGame();
    return;
  }

  const animal = questions[questionIndex];
  const image = $("animalImage");
  const counter = $("questionCounter");
  const feedback = $("feedback");
  const answerArea = $("answerButtons");

  if (image) {
    image.src = animal.src;
    image.alt = capitalize(animal.name);
    image.classList.remove("happyPop", "sadShake");
  }

  if (counter) {
    counter.textContent =
      "Animal " + (questionIndex + 1) +
      " / " + questions.length;
  }

  if (feedback) {
    feedback.textContent = "Which animal is this? 🤔";
    feedback.className = "feedback";
  }

  if (!answerArea) {
    console.error("answerButtons missing in index.html");
    return;
  }

  answerArea.innerHTML = "";

  const wrongOptions = shuffleArray(
    animals.filter((item) => item.name !== animal.name)
  ).slice(0, 3);

  const options = shuffleArray([animal, ...wrongOptions]);

  options.forEach((option) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "answer-button";
    button.textContent = capitalize(option.name);
    button.dataset.answer = option.name;

    answerArea.appendChild(button);
  });

  updateScore();
  updateLives();
  updateLevel();
  updateProgress();
}

// Check answer and show celebration or sad emoji
function checkAnswer(selectedName) {
  if (locked) return;

  locked = true;

  const correctAnimal = questions[questionIndex];
  const isCorrect = selectedName === correctAnimal.name;
  const feedback = $("feedback");
  const image = $("animalImage");

  const buttons = document.querySelectorAll(
    "#answerButtons button"
  );

  buttons.forEach((button) => {
    button.disabled = true;

    if (button.dataset.answer === correctAnimal.name) {
      button.classList.add("correct");
    }

    if (
      button.dataset.answer === selectedName &&
      !isCorrect
    ) {
      button.classList.add("wrong");
    }
  });

  if (isCorrect) {
    score += POINTS;

    if (feedback) {
      feedback.textContent = "🎉🥳🌟 Correct! Amazing job! 🏆✨";
      feedback.className = "feedback correct";
    }

    showEmojiBurst("🎉", "⭐", "🌟", "🥳", "✨");
    showBigEmoji("🎉");

    if (image) {
      image.classList.remove("happyPop", "sadShake");
      void image.offsetWidth;
      image.classList.add("happyPop");
    }
  } else {
    lives--;

    if (feedback) {
      feedback.textContent =
        "😢💔 Oops! Good try! This is a " +
        capitalize(correctAnimal.name) + ". Try the next one! 💪";
      feedback.className = "feedback wrong";
    }

    showBigEmoji("😢");
    showEmojiBurst("💧", "😢", "💔");

    if (image) {
      image.classList.remove("happyPop", "sadShake");
      void image.offsetWidth;
      image.classList.add("sadShake");
    }
  }

  updateScore();
  updateLives();
  updateBestScore();

  window.setTimeout(() => {
    questionIndex++;

    if (lives <= 0 || questionIndex >= questions.length) {
      endGame();
    } else {
      showQuestion();
    }
  }, 1500);
}

// Large emoji overlay
function showBigEmoji(emoji) {
  const old = document.getElementById("answerEmoji");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "answerEmoji";
  overlay.textContent = emoji;

  Object.assign(overlay.style, {
    position: "fixed",
    left: "50%",
    top: "42%",
    transform: "translate(-50%, -50%) scale(0.3)",
    fontSize: "100px",
    zIndex: "10001",
    pointerEvents: "none",
    opacity: "0",
    transition: "transform 0.25s ease, opacity 0.25s ease",
    filter: "drop-shadow(0 5px 8px rgba(0,0,0,0.2))"
  });

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    overlay.style.transform = "translate(-50%, -50%) scale(1)";
  });

  const timer = window.setTimeout(() => {
    overlay.style.opacity = "0";
    overlay.style.transform = "translate(-50%, -50%) scale(0.6)";

    window.setTimeout(() => overlay.remove(), 300);
  }, 900);

  celebrationTimers.push(timer);
}

// Floating celebration emojis
function showEmojiBurst(...emojis) {
  for (let i = 0; i < 12; i++) {
    const piece = document.createElement("span");

    piece.className = "answer-celebration";
    piece.textContent =
      emojis[Math.floor(Math.random() * emojis.length)];

    Object.assign(piece.style, {
      position: "fixed",
      left: (10 + Math.random() * 80) + "%",
      top: (25 + Math.random() * 45) + "%",
      fontSize: (22 + Math.random() * 24) + "px",
      zIndex: "10000",
      pointerEvents: "none",
      transition: "transform 1s ease, opacity 1s ease",
      opacity: "1"
    });

    document.body.appendChild(piece);

    requestAnimationFrame(() => {
      piece.style.transform =
        "translateY(-100px) rotate(25deg)";
      piece.style.opacity = "0";
    });

    const timer = window.setTimeout(() => piece.remove(), 1100);
    celebrationTimers.push(timer);
  }
}

function updateScore() {
  const element = $("score");
  if (element) element.textContent = score;
}

function updateLives() {
  const element = $("lives");

  if (element) {
    element.textContent =
      "❤️".repeat(Math.max(0, lives)) +
      "🤍".repeat(Math.max(0, MAX_LIVES - lives));
  }
}

function updateLevel() {
  const element = $("level");

  if (element) {
    element.textContent =
      Math.floor(questionIndex / 5) + 1;
  }
}

function updateProgress() {
  const bar = $("progressBar");

  if (bar) {
    const progress = questions.length
      ? (questionIndex / questions.length) * 100
      : 0;

    bar.style.width = progress + "%";
  }
}

function updateBestScore() {
  if (score > bestScore) {
    bestScore = score;

    try {
      localStorage.setItem(
        "kids1y7sBestScore",
        String(bestScore)
      );
    } catch (error) {
      console.log("Could not save best score.");
    }
  }

  const best = $("bestScore");
  const finalBest = $("finalBestScore");

  if (best) best.textContent = bestScore;
  if (finalBest) finalBest.textContent = bestScore;
}

function endGame() {
  locked = true;
  showScreen("over");

  const finalScore = $("finalScore");
  const finalBest = $("finalBestScore");
  const icon = $("gameOverIcon");
  const title = $("gameOverTitle");
  const message = $("gameOverMessage");

  if (finalScore) finalScore.textContent = score;

  updateBestScore();

  if (finalBest) finalBest.textContent = bestScore;

  if (lives <= 0) {
    if (icon) icon.textContent = "😢";
    if (title) title.textContent = "KEEP TRYING! 💪";

    if (message) {
      message.textContent =
        "You scored " + score +
        " points! Don't give up, little champion! 💖";
    }
  } else {
    if (icon) icon.textContent = "🏆";
    if (title) title.textContent = "SUPER STAR! 🌟";

    if (message) {
      message.textContent =
        "Amazing! You completed all " +
        questions.length + " animals and earned " +
        score + " points! 🎉🎊";
    }

    showEmojiBurst("🏆", "🎉", "⭐", "🌟", "🎊");
  }
}

function clearCelebrations() {
  celebrationTimers.forEach((timer) => clearTimeout(timer));
  celebrationTimers = [];

  document.querySelectorAll(
    ".answer-celebration, #answerEmoji"
  ).forEach((element) => element.remove());
}

function goHome() {
  locked = false;
  clearCelebrations();
  showScreen("start");
}

function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Offline support
if (
  "serviceWorker" in navigator &&
  (location.protocol === "http:" ||
    location.protocol === "https:")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Offline support registered."))
      .catch((error) =>
        console.error("Service worker error:", error)
      );
  });
}