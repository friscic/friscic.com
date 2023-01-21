class Console {
    maxCharInput = 10;
    content = {};
    lines = document.getElementById("lines");
    input = document.getElementById("input");
    cursor = document.getElementById("cursor");

    constructor() {
        this.checkUriParam();
        this.init();
    }

    init() {
        fetch("./data.json")
            .then((response) => response.json())
            .then((json) => {
                this.content = json;
            });

        document.addEventListener("keydown", (event) => {
            switch (event.code) {
                case "Backspace": {
                    this.input.innerText = input.innerText.substr(
                        0,
                        this.input.innerText.length - 1
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
                    this.newLine({ text: `~/${this.input.innerText} ` });
                    this.inputValidator();
                    this.input.innerText = "";
                    break;
                }
                default:
                    this.appendInput(event.key);
                    event.preventDefault();
                    break;
            }
        });

        document.addEventListener("input", (event) => {
            if (event.data) {
                this.appendInput(event.data);
            }
        });
    }

    checkUriParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get("page");
        if (page && !isNaN(page)) {
            this.inputValidator(page);
        }
    }

    appendInput(char) {
        if (this.input.innerText.length <= this.maxCharInput) {
            this.input.innerText += char;
        }
        this.cursor.value = "";
    }

    newLine(options = {}) {
        const line = document.createElement("div");
        line.innerText = options.text
            ? options.text.replace("%I", this.input.innerText)
            : line.innerText;
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
                    // TODO
                    lines.innerText = "";
                }
            }
        }

        lines.append(line);
        window.scrollTo({
            left: 0,
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    }

    inputValidator(inputString = input.innerText) {
        if (!inputString) {
            this.newLine({ text: `TRY 'HELP' FOR MORE INFOS` });
            return;
        }

        const command = this.matchCommand(inputString);
        command
            ? command.forEach((line) => this.newLine(line))
            : this.newLine({ text: `'${inputString}' IS NOT RECOGNIZED` });
    }

    matchCommand(input) {
        const match = Object.keys(this.content).find((command) =>
            input.match(new RegExp(`^${command}`, "gi"))
        );

        return this.content[match];
    }
}

new Console();
