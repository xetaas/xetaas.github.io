(() => {
  const WORD_LEN = 5;
  const MAX_GUESSES = 6;

  const WORD_LIST_PATH = "words.dat";
  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const remainingEl = document.getElementById("remaining");
  const guessCountEl = document.getElementById("guessCount");
  const keyboardEl = document.getElementById("keyboard");
  const guessForm = document.getElementById("guessForm");
  const guessInput = document.getElementById("guessInput");
  const resetBtn = document.getElementById("resetBtn");

  let wordList = [];
  let candidates = [];
  let guesses = [];
  let gameOver = false;
  let loading = false;

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"]
  ];

  const keyState = new Map(); // letter -> class

  async function init() {
    // init instance variables
    guesses = [];
    gameOver = false;
    keyState.clear();
    renderBoard();
    renderKeyboard();
    setStatus("Loading word list...");
    updateMeta();

    loading = true;
    const loaded = await loadWordList();
    wordList = loaded;
    candidates = [...wordList];
    loading = false;

    updateMeta();
    setStatus("Make a guess.");
    guessInput.value = "";
    guessInput.focus();
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    for (let row = 0; row < MAX_GUESSES; row += 1) {
      const rowEl = document.createElement("div");
      rowEl.className = "row";
      rowEl.setAttribute("role", "row");
      for (let col = 0; col < WORD_LEN; col += 1) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.setAttribute("role", "gridcell");
        tile.dataset.row = String(row);
        tile.dataset.col = String(col);
        rowEl.appendChild(tile);
      }
      boardEl.appendChild(rowEl);
    }
    paintGuesses();
  }

  function renderKeyboard() {
    keyboardEl.innerHTML = "";
    for (const row of keyboardRows) {
      const rowEl = document.createElement("div");
      rowEl.className = "key-row";
      for (const key of row) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "key";
        btn.textContent = key;
        btn.dataset.key = key;
        if (key === "ENTER" || key === "BACK") {
          btn.classList.add("key-wide");
        }
        btn.addEventListener("click", () => handleVirtualKey(key));
        rowEl.appendChild(btn);
      }
      keyboardEl.appendChild(rowEl);
    }
    paintKeyboard();
  }

  function handleVirtualKey(key) {
    if (gameOver) return;
    if (key === "ENTER") {
      submitGuess();
      return;
    }
    if (key === "BACK") {
      guessInput.value = guessInput.value.slice(0, -1);
      return;
    }
    if (guessInput.value.length >= WORD_LEN) return;
    guessInput.value += key;
  }

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = isError ? "status error" : "status";
  }

  function updateMeta() {
    const count = loading ? "--" : candidates.length;
    remainingEl.textContent = `Candidates: ${count}`;
    guessCountEl.textContent = `Guesses: ${guesses.length} / ${MAX_GUESSES}`;
  }

  function submitGuess() {
    if (gameOver) return;
    if (loading) {
      setStatus("Still loading the word list...", true);
      return;
    }
    const raw = guessInput.value.trim().toUpperCase();
    if (raw.length !== WORD_LEN) {
      setStatus(`Guess must be ${WORD_LEN} letters.`, true);
      return;
    }
    if (!wordList.includes(raw)) {
      setStatus("Not in word list.", true);
      return;
    }

    const result = evaluateGuess(raw);
    guesses.push({ guess: raw, feedback: result.feedback });
    paintGuesses();
    updateKeyboardFromGuess(result.feedback, raw);
    updateMeta();

    guessInput.value = "";

    if (result.feedback === "G".repeat(WORD_LEN)) {
      setStatus(`You won in ${guesses.length} guesses.`);
      gameOver = true;
      return;
    }

    if (guesses.length >= MAX_GUESSES) {
      const reveal = candidates[0] || result.fallbackAnswer;
      setStatus(`Out of guesses. One possible answer: ${reveal}`);
      gameOver = true;
      return;
    }

    setStatus("Keep going.");
  }

  function evaluateGuess(guess) {
    const buckets = new Map();
    for (const candidate of candidates) {
      const feedback = getFeedback(guess, candidate);
      if (!buckets.has(feedback)) {
        buckets.set(feedback, []);
      }
      buckets.get(feedback).push(candidate);
    }

    let selectedFeedback = "";
    let selectedBucket = [];
    let maxSize = -1;
    for (const [feedback, list] of buckets.entries()) {
      if (list.length > maxSize) {
        maxSize = list.length;
        selectedFeedback = feedback;
        selectedBucket = list;
      }
    }

    candidates = selectedBucket;
    return {
      feedback: selectedFeedback,
      fallbackAnswer: selectedBucket[0]
    };
  }

  async function loadWordList() {
    try {
      const response = await fetch(WORD_LIST_PATH, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Word list request failed (${response.status}).`);
      }

      const text = await response.text();
      const list = text.split(/\s+/);

      const normalized = Array.from(
        new Set(
          list
            .map((word) => String(word).trim().toUpperCase())
            .filter((word) => word.length === WORD_LEN && /^[A-Z]+$/.test(word))
        )
      );

      if (normalized.length === 0) {
        throw new Error("Word list was empty after filtering.");
      }

      return normalized;
    } catch (error) {
      setStatus("Word list failed to load.", true);
      return [];
    }
  }



  function paintGuesses() {
    const tiles = boardEl.querySelectorAll(".tile");
    tiles.forEach((tile) => {
      tile.textContent = "";
      tile.classList.remove("correct", "present", "absent");
    });

    guesses.forEach((entry, row) => {
      for (let col = 0; col < WORD_LEN; col += 1) {
        const index = row * WORD_LEN + col;
        const tile = tiles[index];
        if (!tile) continue;
        const letter = entry.guess[col];
        const fb = entry.feedback[col];
        tile.textContent = letter;
        if (fb === "G") tile.classList.add("correct");
        if (fb === "Y") tile.classList.add("present");
        if (fb === "-") tile.classList.add("absent");
      }
    });
  }

  function updateKeyboardFromGuess(feedback, guess) {
    for (let i = 0; i < guess.length; i += 1) {
      const letter = guess[i];
      const fb = feedback[i];
      const next = fb === "G" ? "correct" : fb === "Y" ? "present" : "absent";
      const prev = keyState.get(letter);
      if (prev === "correct") continue;
      if (prev === "present" && next === "absent") continue;
      keyState.set(letter, next);
    }
    paintKeyboard();
  }

  function paintKeyboard() {
    const keys = keyboardEl.querySelectorAll(".key");
    keys.forEach((key) => {
      const label = key.dataset.key;
      if (!label || label.length !== 1) return;
      key.classList.remove("correct", "present", "absent");
      const state = keyState.get(label);
      if (state) key.classList.add(state);
    });
  }

  function getFeedback(guess, answer) {
    const feedback = Array.from({ length: WORD_LEN }, () => "-");
    const guessMap = getLetterMap(guess);
    const answerMap = getLetterMap(answer);

    for (const [letter, guessIndices] of guessMap.entries()) {
      const answerIndices = answerMap.get(letter);
      if (!answerIndices) continue;

      if (guessIndices.length === answerIndices.length) {
        for (const idx of guessIndices) {
          if (answerIndices.includes(idx)) {
            feedback[idx] = "G";
          } else {
            feedback[idx] = "Y";
          }
        }
      } else if (guessIndices.length > answerIndices.length) {
        let greens = 0;
        for (const idx of guessIndices) {
          if (answerIndices.includes(idx)) {
            feedback[idx] = "G";
            greens += 1;
          }
        }
        let yellowsLeft = answerIndices.length - greens;
        for (const idx of guessIndices) {
          if (yellowsLeft <= 0) break;
          if (feedback[idx] === "G") continue;
          feedback[idx] = "Y";
          yellowsLeft -= 1;
        }
      } else {
        for (const idx of guessIndices) {
          if (answerIndices.includes(idx)) {
            feedback[idx] = "G";
          } else {
            feedback[idx] = "Y";
          }
        }
      }
    }

    return feedback.join("");
  }

  function getLetterMap(word) {
    const map = new Map();
    for (let i = 0; i < word.length; i += 1) {
      const ch = word[i];
      if (!map.has(ch)) map.set(ch, []);
      map.get(ch).push(i);
    }
    return map;
  }

  guessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitGuess();
  });

  guessInput.addEventListener("input", () => {
    guessInput.value = guessInput.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (guessInput.value.length > WORD_LEN) {
      guessInput.value = guessInput.value.slice(0, WORD_LEN);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (gameOver) return;
    if (event.target === guessInput) return;
    if (event.key === "Enter") {
      submitGuess();
      return;
    }
    if (event.key === "Backspace") {
      guessInput.value = guessInput.value.slice(0, -1);
      return;
    }
    const letter = event.key.toUpperCase();
    if (/^[A-Z]$/.test(letter)) {
      if (guessInput.value.length >= WORD_LEN) return;
      guessInput.value += letter;
    }
  });

  resetBtn.addEventListener("click", () => init());

  init();
})();
