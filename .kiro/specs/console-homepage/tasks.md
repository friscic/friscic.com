# Implementation Plan: Console Homepage

## Overview

Refactor the existing monolithic `app.js` into testable modules, set up Vitest with jsdom and fast-check, and implement comprehensive property-based and unit tests covering all 21 correctness properties and key requirements. The existing HTML, CSS, and data.json are already complete — the focus is on making the JS logic testable and thoroughly tested.

## Tasks

- [ ] 1. Set up testing infrastructure
  - [ ] 1.1 Initialize npm project and install Vitest, jsdom, and fast-check
    - Run `npm init -y`
    - Install `vitest`, `jsdom`, `fast-check` as dev dependencies
    - Create `vitest.config.js` with jsdom environment
    - Create `tests/` directory structure: `tests/unit/`, `tests/property/`
    - _Requirements: Design Testing Strategy_

  - [ ] 1.2 Refactor `app.js` to export testable functions
    - Extract pure functions (`getUrlSearchParams`, `translate`, `inputValidator`, `newCommandLine`, `setCanonicalTag`) into a separate `lib.js` module with ES module exports
    - Keep `app.js` as the entry point that imports from `lib.js` and wires DOM events
    - Ensure the site still works identically in the browser (no behavioral changes)
    - _Requirements: 2.2, 2.3, 3.1, 7.1, 7.2, 8.3, 8.4, 9.4_

- [ ] 2. Implement input handling tests
  - [ ] 2.1 Create `tests/property/input-handling.prop.test.js`
    - Set up jsdom DOM fixtures (`#input`, `#lines`, `#cursor` elements)
    - Import testable functions from `lib.js`
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 2.2 Write property test for character input appending
    - **Property 1: Character input appending**
    - Generate arbitrary printable characters via fast-check
    - Assert displayed input grows by exactly the appended character
    - **Validates: Requirements 2.2**

  - [ ]* 2.3 Write property test for Enter clears input and echoes command
    - **Property 2: Enter clears input and echoes command**
    - Generate arbitrary non-empty strings
    - Assert output contains `~/[input_text]` line and input is cleared
    - **Validates: Requirements 2.3**

  - [ ]* 2.4 Write property test for Backspace removes last character
    - **Property 3: Backspace removes last character**
    - Generate arbitrary non-empty strings
    - Assert input text equals original minus last character; empty stays empty
    - **Validates: Requirements 2.4**

- [ ] 3. Implement command matching and response tests
  - [ ] 3.1 Create `tests/property/command-matching.prop.test.js`
    - Set up DOM fixtures and import translated content from test helpers
    - Load and translate `data.json` for test setup
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

  - [ ]* 3.2 Write property test for case-insensitive command matching
    - **Property 4: Case-insensitive command matching**
    - Generate arbitrary casing variations of known command keys
    - Assert all variations match the same command key
    - **Validates: Requirements 3.1**

  - [ ]* 3.3 Write property test for command response renders all entries
    - **Property 5: Command response renders all entries**
    - For each matched command key, assert rendered line count equals entry count
    - **Validates: Requirements 3.2**

  - [ ]* 3.4 Write property test for placeholder replacement
    - **Property 7: Placeholder replacement**
    - Generate arbitrary input strings and response templates with `%I`
    - Assert rendered text contains user input in place of `%I`
    - **Validates: Requirements 3.5, 13.5**

  - [ ]* 3.5 Write property test for unrecognized command response
    - **Property 8: Unrecognized command response**
    - Generate arbitrary strings that don't match any command key
    - Assert output contains `'[input]' IS NOT RECOGNIZED` and eCnt resets to 0
    - **Validates: Requirements 3.6, 4.4**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement rendering and special command tests
  - [ ] 5.1 Create `tests/property/rendering.prop.test.js`
    - Set up DOM fixtures for response rendering tests
    - _Requirements: 3.3, 3.4, 4.2, 4.3, 5.2, 5.3_

  - [ ]* 5.2 Write property test for response entry rendering options
    - **Property 6: Response entry rendering options**
    - Generate entries with `href` and `highlight` properties
    - Assert `<a>` tag with `target="_blank"` for href entries; `.highlight` class for highlighted entries
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 5.3 Write property test for empty input escalation
    - **Property 9: Empty input escalation**
    - Generate arbitrary counter values (3–100)
    - Assert CHEER for eCnt 3–10, ANGRY for eCnt > 10, with counter value in output
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 5.4 Write property test for CLS/CLEAR clears output
    - **Property 10: CLS/CLEAR clears output**
    - Generate arbitrary prior output states
    - Assert output area contains only the clear confirmation after CLS/CLEAR
    - **Validates: Requirements 5.2**

  - [ ]* 5.5 Write property test for ALL command lists all keys
    - **Property 11: ALL command lists all keys**
    - Assert output contains comma-separated string with every key from translated content
    - **Validates: Requirements 5.3**

- [ ] 6. Implement navigation and language tests
  - [ ] 6.1 Create `tests/property/navigation.prop.test.js`
    - Set up DOM fixtures for navigation and language switcher
    - _Requirements: 6.1, 6.5, 7.3, 7.4_

  - [ ]* 6.2 Write property test for navigation link rendering
    - **Property 12: Navigation link rendering**
    - For each section and language, assert href contains `?command={section}&lang={language}` and link text matches translated first entry
    - **Validates: Requirements 6.1, 6.5**

  - [ ]* 6.3 Write property test for language switcher rendering
    - **Property 15: Language switcher rendering**
    - For each active language and command, assert both `en`/`de` links rendered, command preserved, active language has `.highlight`
    - **Validates: Requirements 7.3, 7.4**

- [ ] 7. Implement translation and data store tests
  - [ ] 7.1 Create `tests/property/translation.prop.test.js`
    - Import translate function and load data.json
    - _Requirements: 7.1, 7.2, 8.3, 8.4_

  - [ ]* 7.2 Write property test for language determination from URL
    - **Property 13: Language determination from URL**
    - Generate arbitrary URL query strings with/without `lang` param
    - Assert correct language resolution, defaulting to `"en"`
    - **Validates: Requirements 7.1**

  - [ ]* 7.3 Write property test for translation extracts correct language text
    - **Property 14: Translation extracts correct language text**
    - For each bilingual entry and each language, assert translated text equals value at active language key
    - **Validates: Requirements 7.2**

  - [ ]* 7.4 Write property test for reference resolution equivalence
    - **Property 17: Reference resolution equivalence**
    - For each ref entry, assert referenced key exists and translated content matches
    - **Validates: Requirements 8.3, 8.4**

- [ ] 8. Implement data store validation and deep link tests
  - [ ] 8.1 Create `tests/property/data-store.prop.test.js`
    - Load data.json and validate schema
    - _Requirements: 8.1, 8.2, 8.5, 13.1, 13.2, 13.3_

  - [ ]* 8.2 Write property test for Data Store schema validation
    - **Property 16: Data Store schema validation**
    - For each key, assert value is array of objects with valid `text` (bilingual) or `ref` (string) properties
    - **Validates: Requirements 8.1, 8.2, 8.5**

  - [ ]* 8.3 Write property test for required commands exist
    - **Property 21: Required commands exist in Data Store**
    - Assert all required Linux, Windows, and site-specific command keys exist with non-empty arrays
    - **Validates: Requirements 13.1, 13.2, 13.3**

  - [ ] 8.4 Create `tests/property/deep-link.prop.test.js`
    - Set up DOM fixtures for deep link testing
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 8.5 Write property test for deep link auto-execution
    - **Property 18: Deep link auto-execution**
    - For each valid command key, simulate page load with `?command=` param
    - Assert output contains response entries for that command
    - **Validates: Requirements 9.1, 9.2**

  - [ ]* 8.6 Write property test for deep link title update
    - **Property 19: Deep link title update**
    - For each valid command and language, assert document title contains command name and language
    - **Validates: Requirements 9.3**

  - [ ]* 8.7 Write property test for canonical tag correctness
    - **Property 20: Canonical tag correctness**
    - Generate arbitrary language and optional command values
    - Assert canonical href equals `https://friscic.com/?lang={language}` with optional `&command={command}`
    - **Validates: Requirements 9.4**

- [ ] 9. Checkpoint - Ensure all property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement unit tests for specific commands and features
  - [ ] 10.1 Create `tests/unit/command-processor.test.js`
    - Write example tests for HELP command showing instructional text
    - Write example tests for ABOUT showing Xing/LinkedIn links
    - Write example tests for TRAVEL showing destination list
    - Write example tests for IMPRINT showing contact info
    - Write example tests for RND producing multiple emoticon lines
    - Write example test for first empty submission (eCnt ≤ 2) showing EMPTY shrug
    - _Requirements: 4.1, 5.1, 6.2, 6.3, 6.4, 13.4_

  - [ ] 10.2 Create `tests/unit/auto-typer.test.js`
    - Write tests for auto-typer firing when lastRun differs from today
    - Write tests for auto-typer storing date after execution
    - Write tests for auto-typer skipping when lastRun matches today
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 10.3 Create `tests/unit/static-assets.test.js`
    - Write tests verifying `index.html` contains inline `<style>` tag
    - Write tests verifying preload link for `style.css`
    - Write tests verifying `defer` attribute on `app.js` script tag
    - Write tests verifying CNAME, robots.txt, sitemap.xml, 404.html exist
    - Write tests verifying meta tags for mobile web app capability, theme color, description
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The key refactoring step (1.2) extracts pure logic from `app.js` into `lib.js` to enable testing without changing site behavior
