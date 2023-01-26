const EventType = Object.freeze({
    KEYDOWN: "keydown",
    KEYPRESS: "keypress",
    INPUT: "input",
});

class Console {
    maxCharInput = 10;

    content = {};

    loading = document.getElementById("loading");
    console = document.getElementById("console");
    lines = document.getElementById("lines");
    input = document.getElementById("input");
    cursor = document.getElementById("cursor");

    constructor() {
        this.setup();
        this.checkUriParam();
    }

    async setup() {
        await fetch("./data.json")
            .then((response) => response.json())
            .then((json) => {
                this.content = json;
            });

        // this.console.style.display = 'none';
        // setTimeout(() => {
        //     this.console.style.display = '';
        //     this.loading.style.display = 'none';
        // }, 2000);

        Object.values(EventType).forEach((eventType) =>
            document.addEventListener(eventType, (event) =>
                this.checkInput(event, eventType)
            )
        );
    }

    checkInput = (event, eventType) => {
        const eventId = (
            event.data ||
            event.key ||
            event.inputType ||
            ""
        )?.toUpperCase();

        switch (eventId) {
            case "ENTER": {
                this.newLine({ text: `~/${this.input.innerText} ` });
                this.inputValidator();
                this.input.innerText = "";
                break;
            }
            case "DELETECONTENTBACKWARD":
            case "BACKSPACE": {
                this.delete();
                break;
            }
            default:
                switch (eventType) {
                    case EventType.KEYPRESS:
                        this.appendInput(event.key);
                        event.preventDefault();
                        break;
                    case EventType.KEYDOWN:
                        break;
                    case EventType.INPUT:
                        if (event.data) {
                            this.appendInput(event.data);
                            event.preventDefault();
                        }
                        break;
                    default:
                        break;
                }

            // if (eventType === EventType.KEYDOWN) {
            //     return;
            // }

            // if (eventType === EventType.KEYPRESS) {
            //     this.appendInput(event.key);
            //     event.preventDefault();
            //     return;
            // }

            // if (event.data) {
            //     this.appendInput(event.data);
            //     event.preventDefault();
            // }
            break;
        }
    };

    checkUriParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get("page");

        if (page) {
            this.inputValidator(page);
        }
    }

    appendInput(char) {
        if (this.input.innerText.length <= this.maxCharInput) {
            this.input.innerText += char;
        }

        // this.cursor.value = '&nbsp;';
    }

    newLine(options) {
        if (!options) {
            this.lines.innerText = "";
        }

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

        this.lines.append(line);

        window.scrollTo({
            left: 0,
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    }

    inputValidator(inputString = this.input.innerText) {
        const keyMatch = Object.keys(this.content).find((command) =>
            inputString.match(new RegExp(`^${command}`, "gi"))
        );

        if (!inputString && !keyMatch) {
            this.newLine({ text: `TRY 'HELP' FOR MORE INFOS` });

            return;
        }

        const valueMatch = this.content[keyMatch];

        if (valueMatch && valueMatch.length) {
            valueMatch.forEach((line) => this.newLine(line));
        } else {
            this.newLine({ text: `'${inputString}' IS NOT RECOGNIZED` });
        }

        if (!valueMatch) {
            this.lines.innerText = "";
        }
    }

    delete() {
        this.input.innerText = input.innerText.substr(
            0,
            this.input.innerText.length - 1
        );
    }
}

new Console();
