const lines = document.getElementById("lines");
const input = document.getElementById("input");
const cursor = document.getElementById("cursor");
let data = {};

fetch("./data.json")
  .then((response) => response.json())
  .then((json) => {
    data = json;
  });

const urlParams = new URLSearchParams(window.location.search);
const page = urlParams.get("page");
if (page && !isNaN(page)) {
  inputValidator(page);
}

document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "Backspace": {
      input.innerText = input.innerText.substr(0, input.innerText.length - 1);
      break;
    }
    default:
      break;
  }
});

document.addEventListener("keypress", (event) => {
  switch (event.code) {
    case "Enter": {
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

function appendInput(char) {
  input.innerText += char;
  cursor.value = "";
}

function newLine(options = {}) {
  let line = document.createElement("div");
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
      case "C": {
        lines.innerText = "";
      }
    }
  }
  lines.append(line);
}

function inputValidator(inputString = input.innerText) {
  const response = data[inputString];
  if (response) {
    response.forEach((line) => {
      newLine(line);
    });
  } else {
    newLine({ text: `'${input.innerText}' is not recognized as a command` });
  }
}
