let current_row = 0;

async function init() {
    const body = document.body;
    for (let row = 0; row < 6; row++) {
        const row_div = document.createElement("div")
        row_div.id = `row-${row}`;
        for (let col = 0; col < 5; col++) {
            const elem = document.createElement("input")
            elem.type = "text";
            elem.maxLength = 1;
            elem.id = `cell-${row}-${col}`;
            elem.readOnly = true
            elem.size = 1;
            row_div.appendChild(elem)
        }
        body.appendChild(row_div)
    }

    const feedback = document.createElement("input");
    feedback.id = "feedback";
    feedback.readOnly = true;
    body.appendChild(feedback);
}


function submit_guess() {
    const guess = document.getElementById("guessInput").value.trim().toUpperCase();

    if (guess.length != 5 || current_row >= 6) return
    
    for (let col = 0; col < 5; col++) {
        const cell = document.getElementById(`cell-${current_row}-${col}`);
        cell.value = guess[col];
        cell.setAttribute("data-color", "B");
    }
    current_row++;
}
init()

document.getElementById("submit").addEventListener("click", submit_guess);


function getLetterMap(word) {

}

function getFeedback(guess, answer) {

}

function evaluateGuess(guess) {
    
}