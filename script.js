const lines = document.getElementById("lines");
const input = document.getElementById("input");
const cursor = document.getElementById("cursor");

let content = {};
fetch("./data.json")
    .then((response) => response.json())
    .then((json) => {
        content = json;
    });

const urlParams = new URLSearchParams(window.location.search);
const page = urlParams.get("page");
if (page && !isNaN(page)) {
    inputValidator(page);
}

function appendInput(char) {
    input.innerText += char;
    cursor.value = "";
}

function newLine(options = {}) {
    const line = document.createElement("div");
    if (options.text) {
        line.innerText = options.text;
    }
    line.className += options.highlight ? " highlight" : "";
    if (options.href) {
        let link = document.createElement("a");
        link.href = options.href;
        link.target = "_blank";
        line.append(link);
    }
    if (options.command) {
        switch (options.command) {
            case "C": { // TODO
                lines.innerText = "";
            }
        }
    }
    lines.append(line);
}

function inputValidator(inputString = input.innerText) {
    const command = matchCommand(inputString) || inputString;
    if (command) {
        content[command]?.forEach((line) => {
            newLine(line);
        });
    } else {
        !input.innerText
            ? newLine({ text: `Try 'cp --help' for more information` })
            : newLine({
                  text: `'${input.innerText}' is not recognized as a command`,
              });
    }
}

function matchCommand(input) {
    return Object.keys(content).find((command) =>
        input.match(new RegExp(`^${command}`, "gi"))
    );
}

document.addEventListener("keydown", (event) => {
    switch (event.code) {
        case "Backspace": {
            input.innerText = input.innerText.substr(
                0,
                input.innerText.length - 1
            );
            break;
        }
        default:
            break;
    }
});

document.addEventListener("keypress", (event) => {
    switch (event.code) {
        case "Enter": {
            newLine({ text: `~/${input.innerText} ` });
            inputValidator();
            input.innerText = "";
            break;
        }
        default:
            appendInput(event.key);
            event.preventDefault();
            break;
    }
});

document.addEventListener("input", (event) => {
    if (event.data) {
        appendInput(event.data);
    }
});
