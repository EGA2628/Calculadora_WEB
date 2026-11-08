const currentEl = document.getElementById("current");
const previousEl = document.getElementById("previous");
const historyList = document.getElementById("history-list");

let current = "0";
let previous = null;
let operator = null;
let overwrite = false; // true después de "=" para empezar un número nuevo
let history = loadHistory();

const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷", "%": "%" };

// ---------- Cálculo ----------
function calculate(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? null : a / b;
    case "%": return b === 0 ? null : a % b;
  }
}

// ---------- Acciones ----------
function inputNumber(n) {
  if (current === "0" || overwrite) {
    current = n;
    overwrite = false;
  } else {
    current += n;
  }
  updateDisplay();
}

function inputDot() {
  if (overwrite) { current = "0"; overwrite = false; }
  if (!current.includes(".")) current += ".";
  updateDisplay();
}

function chooseOperator(op) {
  if (operator && !overwrite) equals(true); // encadenar operaciones: 2 + 3 + ...
  previous = current;
  operator = op;
  overwrite = true;
  updateDisplay();
}

function equals(chained = false) {
  if (operator === null || previous === null) return;

  const a = parseFloat(previous);
  const b = parseFloat(current);
  const result = calculate(a, b, operator);

  if (result === null) {
    showError();
    return;
  }

  const rounded = parseFloat(result.toFixed(10)); // evita 0.1 + 0.2 = 0.30000000000000004
  addToHistory(`${previous} ${symbols[operator]} ${current}`, rounded);

  current = String(rounded);
  previous = chained ? String(rounded) : null;
  operator = chained ? operator : null;
  overwrite = true;
  updateDisplay();
}

function clearAll() {
  current = "0";
  previous = null;
  operator = null;
  overwrite = false;
  updateDisplay();
}

function deleteLast() {
  if (overwrite) return;
  current = current.length > 1 ? current.slice(0, -1) : "0";
  updateDisplay();
}

function showError() {
  clearAll();
  currentEl.textContent = "Error";
  previousEl.textContent = "No se puede dividir entre 0";
}

// ---------- Pantalla ----------
function updateDisplay() {
  currentEl.textContent = current;
  previousEl.textContent = operator ? `${previous} ${symbols[operator]}` : "";
}

// ---------- Historial ----------
function addToHistory(expression, result) {
  history.unshift({ expression, result });
  if (history.length > 50) history.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) {
    historyList.innerHTML = '<li class="empty">Aún no hay operaciones</li>';
    return;
  }
  history.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="expr">${item.expression} =</div><div class="res">${item.result}</div>`;
    li.addEventListener("click", () => { // reutilizar un resultado anterior
      current = String(item.result);
      overwrite = true;
      updateDisplay();
    });
    historyList.appendChild(li);
  });
}

function saveHistory() {
  try { localStorage.setItem("calc-history", JSON.stringify(history)); } catch {}
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem("calc-history")) || []; }
  catch { return []; }
}

document.getElementById("clear-history").addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});

// ---------- Eventos ----------
document.querySelector(".keys").addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;

  if (btn.dataset.number) inputNumber(btn.dataset.number);
  else if (btn.dataset.operator) chooseOperator(btn.dataset.operator);
  else if (btn.dataset.action === "dot") inputDot();
  else if (btn.dataset.action === "equals") equals();
  else if (btn.dataset.action === "clear") clearAll();
  else if (btn.dataset.action === "delete") deleteLast();
});

// Soporte de teclado
document.addEventListener("keydown", e => {
  if (e.key >= "0" && e.key <= "9") inputNumber(e.key);
  else if (["+", "-", "*", "/", "%"].includes(e.key)) chooseOperator(e.key);
  else if (e.key === "." || e.key === ",") inputDot();
  else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); }
  else if (e.key === "Backspace") deleteLast();
  else if (e.key === "Escape") clearAll();
});

renderHistory();