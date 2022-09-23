import translations from './translations.json' assert { type: "json" }

export const translate = (query) => {
  const urlParams = new URLSearchParams(query)
  const lang = urlParams.get('l') ?? 'en'

  for (var section in translations) {
    for (var line in translations[section]) {
    //   var element = document.getElementById(section + '-' + line)
    //   if (element) {
    //     element.innerText = translations[section][line][lang]
    //   }
    }
  }
}
