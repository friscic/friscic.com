const EventType = Object.freeze({
    KeyDown: "keydown",
    KeyPress: "keypress",
    Input: "input",
});

class Console {
    maxCharInput = 100;
    content = {};
    language = "EN";
    loading = document.getElementById("loading");
    console = document.getElementById("console");
    lines = document.getElementById("lines");
    input = document.getElementById("input");
    cursor = document.getElementById("cursor");

    constructor() {
        this.setup();
    }

    async setup() {
        await fetch("./data.json")
            .then((response) => response.json())
            .then((json) => {
                const urlParams = new URLSearchParams(window.location.search);
                const page = urlParams.get("page");
                page && this.inputValidator(page);

                const lang = urlParams.get("lang");
                this.language = lang && lang !== this.language ? lang : "en";

                Object.entries(json).forEach((entry) => {
                    if (!entry[0]) {
                        return;
                    }
                    this.content[entry[0]] =
                        entry[1]?.map((obj) =>
                            obj.text
                                ? {
                                      ...obj,
                                      text: obj.text[this.language],
                                  }
                                : obj
                        ) || {};
                });
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

        // TODO loading
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const page = urlParams.get("page");
            page && this.inputValidator(page);

            const lang = urlParams.get("lang");
            if (lang !== this.language) {
                this.language = lang;
            }
        }, 100);
    }

    translate() {}

    checkInput = (event, eventType) => {
        const eventId = (
            event.data ||
            event.key ||
            event.inputType
        )?.toUpperCase();

        if (!eventId) {
            this.newLine({ text: `(⊘_⊘）ups...` });
            return;
        }

        if (eventId === "ENTER") {
            this.newLine({ text: `~/${this.input.innerText} ` });
            this.inputValidator();
            if (this.input.innerText === "CLS") {
                this.lines.innerText = "";
            }
            this.input.innerText = "";
            event.preventDefault();

            return;
        }

        if (eventId === "DELETECONTENTBACKWARD" || eventId === "BACKSPACE") {
            this.input.innerText = input.innerText.substr(
                0,
                this.input.innerText.length - 1
            );

            return;
        }

        if (eventType === EventType.KeyPress) {
            this.appendInput(event.key);
            event.preventDefault();

            return;
        }

        if (eventType === EventType.Input && event.data) {
            this.appendInput(event.data);
            event.preventDefault();

            return;
        }
    };

    checkUriParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get("page");
        const lang = urlParams.get("lang");

        if (page) {
            this.inputValidator(page);
        }

        if (lang) {
            this.language = lang;
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
            this.newLine({ text: `¯\\_(ツ)_/¯TRY 'HELP'` }); // TODO lang

            return;
        }

        const valueMatch = this.content[keyMatch];

        if (valueMatch && valueMatch.length) {
            valueMatch.forEach((line) => this.newLine(line));
        } else {
            this.newLine({ text: `'${inputString}' IS NOT RECOGNIZED` });
        }

        // if (!valueMatch) {
        //     this.lines.innerText = "";
        // }
    }
}

new Console();
