const EventType = Object.freeze({
    KeyDown: "keydown",
    KeyPress: "keypress",
    Input: "input",
});

const File = {
    Data: "./data.json",
    Script: "./script.js",
};

const Model = {
    content: {},
    language: "en",
    loading: document.getElementById("loading"),
    // console: document.getElementById("console"), // TODO
    lines: document.getElementById("lines"),
    input: document.getElementById("input"),
    cursor: document.getElementById("cursor"),
};

class Console {
    constructor() {
        this.loder(); // todo
        this.init(this.searchParams());
        this.addEventListener();
    }

    async init(input) {
        await fetch(File.Data)
            .then((response) => response.json())
            .then((json) => {
                this.translate(json);
                if (input) {
                    this.inputValidator(input);
                }
            });
    }

    loder() {
        // this.console.style.display = "none";
        // setTimeout(() => {
        //     this.console.style.display = "";
        //     Model.loading.style.display = "none";
        // }, 2000);
    }

    searchParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const lang = urlParams.get("lang");

        if (lang && lang !== Model.language) {
            Model.language = lang;
        }

        return urlParams.get("page");
    }

    addEventListener() {
        Object.values(EventType).forEach((eventType) =>
            document.addEventListener(eventType, (event) =>
                this.checkInput(event, eventType)
            )
        );
    }

    translate(json) {
        Object.entries(json).forEach((entry) => {
            Model.content[entry[0]] =
                entry[1]?.flatMap((obj) => {
                    const d = obj.ref ? json[obj.ref] : obj;
                    return d.text
                        ? {
                              ...d,
                              text: d.text[Model.language],
                          }
                        : d;
                }) || {};
        });
        console.log(Model.content);
    }

    checkInput = (event, eventType) => {
        Model.cursor.value = " ";
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
            this.newLine({ text: `~/${Model.input.innerText} ` });
            this.inputValidator();
            if (Model.input.innerText === "CLS") {
                Model.lines.innerText = "";
            }
            Model.input.innerText = "";
            event.preventDefault();

            return;
        }

        if (eventId === "DELETECONTENTBACKWARD" || eventId === "BACKSPACE") {
            Model.input.innerText = input.innerText.substr(
                0,
                Model.input.innerText.length - 1
            );

            return;
        }

        if (eventType === EventType.KeyPress) {
            Model.input.innerText += event.key;
            event.preventDefault();

            return;
        }

        if (eventType === EventType.Input && event.data) {
            Model.input.innerText += event.data;
            event.preventDefault();

            return;
        }
    };

    newLine(options) {
        if (!options) {
            Model.lines.innerText = "";
        }
        const line = document.createElement("div");
        line.innerText = options.text
            ? options.text.replace("%I", Model.input.innerText)
            : line.innerText;
        line.className += options.highlight ? " highlight" : "";
        if (options.href) {
            let link = document.createElement("a");
            link.href = options.href;
            link.target = "_blank";
            line.append(link);
        }
        Model.lines.append(line);

        window.scrollTo({
            left: 0,
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    }

    inputValidator(inputString = Model.input.innerText) {
        const keyMatch = Object.keys(Model.content).find((command) =>
            inputString.match(new RegExp(`^${command}`, "gi"))
        );

        if (!inputString && !keyMatch) {
            this.newLine({ text: `¯\\_(ツ)_/¯TRY 'HELP'` }); // TODO lang

            return;
        }

        const valueMatch = Model.content[keyMatch];

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
