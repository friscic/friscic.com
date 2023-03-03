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
    page: null,
    loading: document.getElementById("loading"),
    // console: document.getElementById("console"),
    navigation: document.getElementById("navigation"),
    lines: document.getElementById("lines"),
    input: document.getElementById("input"),
    cursor: document.getElementById("cursor"),
    footer: document.getElementById("footer"),
};

const Navigation = {
    About: "ABOUT",
    Contact: "CONTACT",
    Imprint: "IMPRINT",
};

class Console {
    constructor() {
        this.init(this.searchParams());
        this.addEventListener();
    }

    async init(input) {
        // this.loder(input ? 2000 : 10);

        await fetch(File.Data)
            .then((response) => response.json())
            .then((json) => {
                this.translate(json);
            })
            .finally(() => {
                if (input) {
                    this.inputValidator(input);
                }
                
                if (Object.values(Navigation).includes(input)) {
                    Model.page = input.toLowerCase();
                }

                this.addLanguageSwitch("en");
                this.addLanguageSwitch("de");

                input !== Navigation.About &&
                    this.addNavigationItem(Navigation.About);
                input !== Navigation.Contact &&
                    this.addNavigationItem(Navigation.Contact);
                input !== Navigation.Imprint &&
                    this.addNavigationItem(Navigation.Imprint);
            });
    }

    loder(timeout) {
        // Model.console.style.display = "none";
        // setTimeout(() => {
        //     Model.console.style.display = "";
        //     Model.loading.style.display = "none";
        // }, timeout);
    }

    searchParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const lang = urlParams.get("lang");

        if (lang && lang !== Model.language) {
            Model.language = lang;
            document.children[0].lang = lang;
        }

        return urlParams.get("page")?.toUpperCase();
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
                entry[1]?.flatMap((obj) =>
                    obj.ref
                        ? json[obj.ref].map((t) =>
                              t.text
                                  ? {
                                        ...t,
                                        text: t.text[Model.language],
                                    }
                                  : d
                          )
                        : obj.text
                        ? {
                              ...obj,
                              text: obj.text[Model.language],
                          }
                        : d
                ) || {};
        });
    }

    addNavigationItem(name) {
        const item = document.createElement("h2");
        const link = document.createElement("a");
        const text = document.createElement("span");
        link.href = `?page=${name}&lang=${Model.language}`;
        text.innerText = Model.content[name][0]?.text;
        link.appendChild(text);
        item.appendChild(link);
        Model.navigation.appendChild(item);
    }

    addLanguageSwitch(lang) {
        const item = document.createElement("a");
        item.href = `?lang=${lang}&page=${Model.page || ''}`;
        item.innerText = lang;
        if (lang === Model.language) {
            item.classList.add("highlight");
        }
        Model.footer.prepend(item);
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
            event.preventDefault();

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

        if (options.highlight) {
            line.className += " highlight";
        }
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
