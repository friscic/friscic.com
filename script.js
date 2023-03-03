const EventType = Object.freeze({
    KeyDown: "keydown",
    KeyPress: "keypress",
    Input: "input",
});

const Navigation = Object.freeze({
    About: "ABOUT",
    Contact: "CONTACT",
    Imprint: "IMPRINT",
});

class Console {
    content = {};
    language = "en";
    page = null;
    urlParams = {};
    loading = document.getElementById("loading");
    // console = document.getElementById("console");
    navigation = document.getElementById("navigation");
    lines = document.getElementById("lines");
    input = document.getElementById("input");
    cursor = document.getElementById("cursor");
    footer = document.getElementById("footer");

    constructor() {
        this.init(this.searchParams());
        this.addEventListener();
    }

    async init(input) {
        // this.loder(input ? 2000 : 10);

        await fetch("./data.json")
            .then((response) => response.json())
            .then((json) => {
                this.translate(json);
            })
            .finally(() => {
                if (input) {
                    this.inputValidator(input);
                }

                if (Object.values(Navigation).includes(input)) {
                    this.page = input.toLowerCase();
                }

                this.addLanguageSwitch("en");
                this.addLanguageSwitch("de");

                this.addNavigationItem(Navigation.About);
                this.addNavigationItem(Navigation.Contact);
                this.addNavigationItem(Navigation.Imprint);
            });
    }

    loder(timeout) {
        // this.console.style.display = "none";
        // setTimeout(() => {
        //     this.console.style.display = "";
        //     this.loading.style.display = "none";
        // }, timeout);
    }

    searchParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const lang = urlParams.get("lang");

        if (lang && lang !== this.language) {
            this.language = lang;
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
            this.content[entry[0]] =
                entry[1]?.flatMap((obj) =>
                    obj.ref
                        ? json[obj.ref].map((t) =>
                              t.text
                                  ? {
                                        ...t,
                                        text: t.text[this.language],
                                    }
                                  : d
                          )
                        : obj.text
                        ? {
                              ...obj,
                              text: obj.text[this.language],
                          }
                        : d
                ) || {};
        });
    }

    addNavigationItem(name) {
        const item = document.createElement("h2");
        const link = document.createElement("a");
        link.href = `?page=${name}&lang=${this.language}`;
        link.innerText = this.content[name][0]?.text;
        item.appendChild(link);
        this.navigation.appendChild(item);
    }

    addLanguageSwitch(lang) {
        const item = document.createElement("a");
        item.href = `?lang=${lang}&page=${this.page || ""}`;
        item.innerText = lang;
        if (lang === this.language) {
            item.classList.add("highlight");
        }
        this.footer.append(item);
    }

    checkInput = (event, eventType) => {
        this.cursor.value = " ";
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
            event.preventDefault();

            return;
        }

        if (eventType === EventType.KeyPress) {
            this.input.innerText += event.key;
            event.preventDefault();

            return;
        }

        if (eventType === EventType.Input && event.data) {
            this.input.innerText += event.data;
            event.preventDefault();

            return;
        }
    };

    newLine(options) {
        if (!options) {
            this.lines.innerText = "";
        }
        const line = document.createElement("div");
        line.innerText = options.text
            ? options.text.replace("%I", this.input.innerText)
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
