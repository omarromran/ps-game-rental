const displayElement = document.getElementById('display');
let currentInput = '0';
let previousInput = null;
let operation = null;

function updateDisplay() {
    displayElement.innerText = currentInput;
}

function clearCalculator() {
    currentInput = '0';
    previousInput = null;
    operation = null;
    updateDisplay();
}

function handleNumber(number) {
    if (currentInput === '0') currentInput = number;
    else currentInput += number;
    updateDisplay();
}

function handleOperator(nextOp) {
    previousInput = currentInput;
    currentInput = '0';
    operation = nextOp;
}

function calculate() {
    const prev = parseFloat(previousInput);
    const curr = parseFloat(currentInput);

    if (isNaN(prev) || isNaN(curr)) return;

    switch (operation) {
        case 'add': currentInput = (prev + curr).toString(); break;
        case 'subtract': currentInput = (prev - curr).toString(); break;
        case 'multiply': currentInput = (prev * curr).toString(); break;
        case 'divide': currentInput = (prev / curr).toString(); break;
    }
    operation = null;
    updateDisplay();
}

// Event Listeners
document.querySelector('.buttons').addEventListener('click', (e) => {
    if (!e.target.matches('button')) return;

    const val = e.target.innerText;
    const action = e.target.dataset.action;

    if (action === 'clear') clearCalculator();
    else if (action === 'calculate') calculate();
    else if (action) handleOperator(action);
    else handleNumber(val);
});

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if (e.key >= 0 && e.key <= 9) handleNumber(e.key);
    if (e.key === '+') handleOperator('add');
    if (e.key === '-') handleOperator('subtract');
    if (e.key === '*') handleOperator('multiply');
    if (e.key === '/') handleOperator('divide');
    if (e.key === 'Enter' || e.key === '=') calculate();
    if (e.key === 'Escape') clearCalculator();
});