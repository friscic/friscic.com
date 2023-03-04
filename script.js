/**
 * variable declaration
 */
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
const Language = Object.freeze({ En: "en", De: "de" });
let loading = document.getElementById("loading");
let navigation = document.getElementById("navigation");
let lines = document.getElementById("lines");
let input = document.getElementById("input");
let cursor = document.getElementById("cursor");
let footer = document.getElementById("footer");
let [language, command] = getUrlSearchParams();
let content = {};
let enterCounter = 0;

/**
 * [app] start up
 * @param loader (optional) flag to display loading animation (disabled by default)
 */
async function start() {
    await fetch("./data.json")
        .then((response) => response.json())
        .then((json) => {
            translate(json);
            Object.values(Language).forEach(addLanguageSwitch);
            Object.values(Navigation).forEach(addNavigationItem);
            Object.values(EventType).forEach(addEventListener);

            if (command) {
                inputValidator(command);
            }
        });
}

/**
 * [app] check for url query strings (e.g. lang & page)
 */
function getUrlSearchParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang") || Language.En;

    return [lang, urlParams.get("page")?.toUpperCase()];
}

/**
 * [app] translate content json
 */
function translate(json) {
    Object.entries(json).forEach((entry) => {
        content[entry[0]] =
            entry[1]?.flatMap((obj) =>
                obj.ref
                    ? json[obj.ref].map((t) =>
                          t.text
                              ? {
                                    ...t,
                                    text: t.text[language],
                                }
                              : d
                      )
                    : obj.text
                    ? {
                          ...obj,
                          text: obj.text[language],
                      }
                    : d
            ) || {};
    });
}

/**
 * [app] add event listeners
 */
const addEventListener = (eventType) =>
    document.addEventListener(eventType, (event) =>
        checkInput(event, eventType)
    );

/**
 * [ui] add navigation item
 * @param name command/input
 */
const addNavigationItem = (name) => {
    const item = document.createElement("h2");
    const link = document.createElement("a");
    link.href = `?page=${name}&lang=${language}`;
    link.innerText = content[name][0]?.text;
    item.appendChild(link);
    navigation.appendChild(item);
};

/**
 * [ui] add language switcher
 * @param lang langauge id (e.g. 'en' or 'de')
 */
const addLanguageSwitch = (lang) => {
    const item = document.createElement("a");
    item.href = `?lang=${lang}&page=${command || ""}`;
    item.innerText = lang;
    if (lang === language) {
        item.classList.add("highlight");
    }
    footer.append(item);
};

/**
 * [console] add new line
 * @param options todo
 */
function newLine(options) {
    const line = document.createElement("div");
    if (options.highlight) {
        line.className += " highlight";
    }

    if (options.href) {
        let link = document.createElement("a");
        link.href = options.href;
        link.target = "_blank";
        link.innerText = options.text;
        line.append(link);
    } else {
        line.innerText = options.text
            ? options.text.replace("%I", input.innerText)
            : line.innerText;
    }

    lines.append(line);

    window.scrollTo({
        left: 0,
        top: document.body.scrollHeight,
        behavior: "smooth",
    });
}

/**
 * [console] check input data
 * @param options todo
 */
const checkInput = (event, eventType) => {
    const eventId = (event.data || event.key || event.inputType)?.toUpperCase();
    cursor.value = " "; // hacking input value

    if (!eventId) {
        newLine({ text: `(⊘_⊘）ups...` });
    } else if (eventId === "ENTER") {
        newLine({ text: `~/${input.innerText} ` });
        inputValidator();
        if (input.innerText === "CLS") {
            lines.innerText = "";
        }
        input.innerText = "";
        event.preventDefault();
    } else if (eventId === "DELETECONTENTBACKWARD" || eventId === "BACKSPACE") {
        input.innerText = input.innerText.substring(
            0,
            input.innerText.length - 1
        );
        event.preventDefault();
    } else if (eventType === EventType.KeyPress) {
        input.innerText += event.key;
        event.preventDefault();
    } else if (eventType === EventType.Input && event.data) {
        input.innerText += event.data;
        event.preventDefault();
    }
};

/**
 * [console] validate input command
 * @param inputString input line inner text (if not passed on)
 */
function inputValidator(inputString = input.innerText) {
    const keyMatch = Object.keys(content).find((command) =>
        inputString.match(new RegExp(`^${command}`, "gi"))
    );
    const valueMatch = content[keyMatch];

    if (!inputString && !keyMatch) {
        newLine({
            text:
                enterCounter > 2
                    ? `${enterCounter > 10 ? "(ノಠ益ಠ)ノ !" : "(╯°□°）╯"}  ${
                          enterCounter + 1
                      } º`
                    : `¯\\_(ツ)_/¯ TRY 'HELP'`,
        });
        enterCounter++;
    } else if (valueMatch?.length) {
        valueMatch.forEach((line) => newLine(line));
        enterCounter = 0;
    } else {
        newLine({ text: `'${inputString}' IS NOT RECOGNIZED` });
        enterCounter = 0;
    }
}

start();
