# Requirements Document

## Introduction

This document specifies the requirements for **friscic.com**, a personal homepage for Manfred Friščić styled as a retro console/terminal UI. The site presents professional information, travel history, and legal imprint through a command-line interface metaphor. Users interact by typing commands into a terminal-style input field and receiving predefined, often humorous, responses. The site supports bilingual content (English/German), URL-based deep linking, and performance-optimized static hosting. A future goal is to augment the predefined command system with AI-powered responses for arbitrary user input.

## Glossary

- **Console_UI**: The terminal-style user interface rendered in the browser, featuring green-on-black monospace text, CRT scanline effects, and a blinking cursor input field.
- **Command_Input**: The text input field at the bottom of the Console_UI where users type commands and press Enter to submit.
- **Command_Processor**: The application logic in `app.js` that receives user input from the Command_Input, matches it against known command keys, and renders the corresponding response.
- **Data_Store**: The `data.json` file containing all content, translations, and command-response mappings as a flat key-value structure with reference (`ref`) support.
- **Response_Renderer**: The component of the Command_Processor that creates new DOM elements in the output area (`#lines`) to display command responses, including text, links, and highlighted entries.
- **Navigation_Bar**: The set of navigation links (ABOUT, TRAVEL, IMPRINT) rendered as `<h2>` elements above the command output area.
- **Language_Switcher**: The footer links that allow toggling between English (`en`) and German (`de`) via URL query parameters.
- **Deep_Link**: A URL containing `?command=` and/or `?lang=` query parameters that loads a specific content section and language on page load.
- **Auto_Typer**: The feature that simulates typing "Hello" into the Command_Input on the user's first daily visit, using localStorage to track the last run date.
- **Empty_Input_Counter**: A counter (`eCnt`) that tracks consecutive empty command submissions and escalates the emoticon response from shrug to cheer to angry.

## Requirements

### Requirement 1: Terminal-Style UI Rendering

**User Story:** As a visitor, I want the homepage to look and feel like a retro computer terminal, so that the browsing experience is distinctive and memorable.

#### Acceptance Criteria

1. THE Console_UI SHALL render all text in green (#41ff00) monospace font on a black background.
2. THE Console_UI SHALL display CRT scanline effects using CSS pseudo-elements on the `<body>` element with a 2px horizontal line gradient and a subtle RGB color fringe.
3. THE Console_UI SHALL display a screen flicker animation on the `<body>::after` pseudo-element at a 0.15-second interval.
4. THE Console_UI SHALL constrain the main content area to a maximum width of 15rem with a right border in the terminal green color.
5. THE Console_UI SHALL render highlighted elements with a green background and black text using the `.highlight` CSS class.

### Requirement 2: Command Input and Submission

**User Story:** As a visitor, I want to type commands into a terminal prompt and press Enter to submit them, so that I can interact with the site like a real console.

#### Acceptance Criteria

1. THE Command_Input SHALL display a `~$` prompt prefix followed by the user's typed text and a blinking cursor element.
2. THE Command_Input SHALL accept character input from both `keypress` and `input` DOM events and append each character to the displayed input text.
3. WHEN the user presses Enter, THE Command_Processor SHALL display the entered command as `~/[input_text]` in the output area, process the command, and clear the Command_Input.
4. WHEN the user presses Backspace or triggers a `deleteContentBackward` input event, THE Command_Input SHALL remove the last character from the displayed input text.
5. THE Console_UI SHALL render a blinking cursor input element that blinks at a 1-second interval using CSS animation.

### Requirement 3: Command Matching and Response Display

**User Story:** As a visitor, I want to receive themed responses when I type known commands, so that the terminal experience feels interactive and entertaining.

#### Acceptance Criteria

1. WHEN the user submits a command, THE Command_Processor SHALL match the input against keys in the Data_Store using a case-insensitive regex match from the beginning of the input string.
2. WHEN a matching command key is found, THE Response_Renderer SHALL display all response entries for that key as new lines in the output area.
3. WHEN a response entry contains an `href` property, THE Response_Renderer SHALL render it as a clickable link opening in a new browser tab.
4. WHEN a response entry contains a `highlight` property set to true, THE Response_Renderer SHALL apply the `.highlight` CSS class to that line.
5. WHEN a response entry text contains the `%I` placeholder, THE Response_Renderer SHALL replace it with the user's original input text.
6. WHEN no matching command key is found and the input is non-empty, THE Response_Renderer SHALL display `'[input]' IS NOT RECOGNIZED` and reset the Empty_Input_Counter to zero.

### Requirement 4: Empty Input Escalation

**User Story:** As a visitor, I want to see escalating emoticon reactions when I repeatedly press Enter without typing anything, so that the terminal feels alive and responsive.

#### Acceptance Criteria

1. WHEN the user submits an empty command for the first time (Empty_Input_Counter <= 2), THE Response_Renderer SHALL display the EMPTY response (`¯\_(ツ)_/¯ TRY 'HELP'`).
2. WHEN the user submits an empty command and the Empty_Input_Counter is between 3 and 10 (inclusive), THE Response_Renderer SHALL display the CHEER emoticon response with the counter value.
3. WHEN the user submits an empty command and the Empty_Input_Counter exceeds 10, THE Response_Renderer SHALL display the ANGRY emoticon response with the counter value.
4. WHEN the user submits a non-empty unrecognized command, THE Command_Processor SHALL reset the Empty_Input_Counter to zero.

### Requirement 5: Special Commands (HELP, CLS/CLEAR, ALL)

**User Story:** As a visitor, I want special utility commands that provide help, clear the screen, or list all commands, so that I can navigate the terminal effectively.

#### Acceptance Criteria

1. WHEN the user submits the HELP command, THE Response_Renderer SHALL display instructional text explaining how to use numbered navigation (1-3) and experimental commands.
2. WHEN the user submits the CLS or CLEAR command, THE Command_Processor SHALL remove all previous output from the output area and display the clear confirmation response.
3. WHEN the user submits the ALL command, THE Command_Processor SHALL remove all previous output and display a comma-separated list of all available command keys from the Data_Store.

### Requirement 6: Navigation Sections

**User Story:** As a visitor, I want to access ABOUT, TRAVEL, and IMPRINT sections through both navigation links and typed commands, so that I can browse the site content.

#### Acceptance Criteria

1. THE Navigation_Bar SHALL render clickable links for ABOUT, TRAVEL, and IMPRINT sections, each linking to a Deep_Link URL with the corresponding command and current language.
2. WHEN the ABOUT command (or numeric key "1") is submitted, THE Response_Renderer SHALL display professional profile links (Xing, LinkedIn) with the section header.
3. WHEN the TRAVEL command (or numeric key "3") is submitted, THE Response_Renderer SHALL display a chronological list of travel destinations with links to Google Photos albums.
4. WHEN the IMPRINT command (or numeric key "2") is submitted, THE Response_Renderer SHALL display legal contact information including name, address, email, and phone number.
5. THE Navigation_Bar link text SHALL use the translated first entry text from the corresponding Data_Store section for the active language.

### Requirement 7: Bilingual Support (English/German)

**User Story:** As a visitor, I want to switch between English and German, so that I can view the site content in my preferred language.

#### Acceptance Criteria

1. THE Command_Processor SHALL determine the active language from the `lang` URL query parameter, defaulting to English (`en`) when the parameter is absent.
2. THE Command_Processor SHALL translate all Data_Store entries by extracting the text value for the active language key from each bilingual text object.
3. THE Language_Switcher SHALL render links for both `en` and `de` languages in the footer, preserving the current command parameter in the URL.
4. THE Language_Switcher SHALL apply the `.highlight` CSS class to the link matching the currently active language.
5. WHEN the language is changed via the Language_Switcher, THE Console_UI SHALL reload the page with the updated `lang` parameter and re-translate all content.

### Requirement 8: Data-Driven Content Architecture

**User Story:** As a developer, I want all content and translations stored in a single JSON file with reference support, so that content updates require no code changes.

#### Acceptance Criteria

1. THE Data_Store SHALL store all command-response mappings as a flat JSON object where keys are command identifiers and values are arrays of response entry objects.
2. THE Data_Store SHALL support bilingual text entries where each text property is an object with `en` and `de` keys containing the respective translations.
3. THE Data_Store SHALL support reference entries using a `ref` property that points to another key in the Data_Store, enabling content reuse (e.g., ABOUT referencing key "1").
4. WHEN the Command_Processor translates the Data_Store, THE Command_Processor SHALL resolve all `ref` entries by replacing them with the translated content from the referenced key.
5. THE Data_Store SHALL support optional `href` and `highlight` properties on response entries to control link rendering and visual emphasis.

### Requirement 9: URL-Based Deep Linking

**User Story:** As a visitor, I want to share or bookmark specific sections of the site via URL parameters, so that I can link directly to content.

#### Acceptance Criteria

1. WHEN the page loads with a `command` URL query parameter, THE Command_Processor SHALL automatically execute that command and display its response.
2. WHEN a Deep_Link includes both `command` and `lang` parameters, THE Console_UI SHALL apply the specified language and execute the specified command.
3. WHEN a Deep_Link command is executed, THE Command_Processor SHALL update the document title to include the command name (or its translated equivalent) and the active language.
4. THE Console_UI SHALL set a canonical link tag in the document head reflecting the current language and command parameters.

### Requirement 10: Auto-Typing Animation on First Daily Visit

**User Story:** As a visitor, I want to see a welcoming "Hello" auto-typed on my first visit each day, so that the terminal feels alive and greeting.

#### Acceptance Criteria

1. WHEN the page loads and the current date does not match the `lastRun` value in localStorage, THE Auto_Typer SHALL simulate typing "Hello" into the Command_Input with randomized delays between 500ms and 1000ms per character.
2. WHEN the Auto_Typer completes the typing animation, THE Auto_Typer SHALL store the current date string in localStorage under the `lastRun` key.
3. WHEN the page loads and the current date matches the `lastRun` value in localStorage, THE Auto_Typer SHALL not execute the typing animation.

### Requirement 11: Performance Optimization

**User Story:** As a visitor, I want the page to load quickly and score high on Lighthouse, so that the experience is smooth even on slow connections.

#### Acceptance Criteria

1. THE Console_UI SHALL inline critical CSS (font, color, background, CRT effects) directly in the HTML `<head>` to avoid render-blocking.
2. THE Console_UI SHALL preload the external stylesheet (`style.css`) using `<link rel="preload">` with an `onload` handler to apply it asynchronously.
3. THE Console_UI SHALL defer loading of the application script (`app.js`) using the `defer` attribute.
4. THE Console_UI SHALL lazy-load the Google Analytics script by dynamically creating and appending the script element only after the `window.load` event fires.

### Requirement 12: Static Site Hosting and SEO

**User Story:** As the site owner, I want the site hosted as a static site with proper SEO configuration, so that it is discoverable and accessible.

#### Acceptance Criteria

1. THE Console_UI SHALL include a CNAME file mapping to `www.friscic.com` for GitHub Pages custom domain hosting.
2. THE Console_UI SHALL include a `robots.txt` file allowing all user agents and referencing the sitemap URL.
3. THE Console_UI SHALL include a `sitemap.xml` file listing all primary URLs including language and command parameter variants.
4. THE Console_UI SHALL include a custom 404 error page displaying a themed error message consistent with the terminal aesthetic.
5. THE Console_UI SHALL include appropriate meta tags for mobile web app capability, theme color, and description.

### Requirement 13: Predefined Command Responses

**User Story:** As a visitor, I want a rich set of predefined commands with humorous themed responses, so that exploring the terminal is fun and engaging.

#### Acceptance Criteria

1. THE Data_Store SHALL contain response entries for common Linux commands including: LS, PWD, MKDIR, MV, CP, RM, CAT, GREP, HEAD, TAIL, DIFF, SORT, TAR, CHMOD, CHOWN, KILL, DF, MOUNT, TOP, PS, SUDO, WHOAMI, UNAME, WHEREIS, WHATIS, USERADD, USERMOD, PASSWD, CD, TOUCH, ECHO, LESS, EXPORT, ALIAS, DD, CAL, SSH, APT, PACMAN, YUM, RPM, UFW, IPTABLES, WGET, TRACEROUTE.
2. THE Data_Store SHALL contain response entries for common Windows commands including: DIR, COPY, DEL, PING, TRACERT, FORMAT, CHKDSK, NSLOOKUP, SHUTDOWN, NETSTAT, NET, IPCONFIG.
3. THE Data_Store SHALL contain response entries for site-specific and easter egg commands including: HELLO, HELP, CLS, CLEAR, ALL, AC, OOPS, IN, RND, SLEEPY, CHEER, ANGRY, ABOUT, ABOUT ME, TRAVEL, IMPRINT.
4. WHEN the RND command is submitted, THE Response_Renderer SHALL display a collection of ASCII art emoticon faces.
5. THE Data_Store SHALL support the `%I` placeholder in response text, which THE Response_Renderer SHALL replace with the user's input text at render time.

### Requirement 14: Scroll Behavior

**User Story:** As a visitor, I want the terminal to auto-scroll to the latest output, so that I always see the most recent response.

#### Acceptance Criteria

1. WHEN a new response line is added to the output area, THE Response_Renderer SHALL smooth-scroll the window to the bottom of the document body.
2. WHEN the page finishes loading initial content (including Deep_Link command execution), THE Console_UI SHALL scroll to the bottom of the document body.
