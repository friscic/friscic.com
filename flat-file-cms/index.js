// const translations = require('translations');
// await fetch('./translations.json')

function loadJSON(callback) {   

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', 'translations.json', true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
 }





const load = () => {
    // translate();
    // insertPic();
    insertPhone();

    window.addEventListener('resize', () => insertPic());


    loadJSON((response) => {
        // Parse JSON string into object
          var actual_JSON = JSON.parse(response);
          console.log(actual_JSON);
       });
}

const translate = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('l') ?? 'en';

    for (var section in translations) {
        for (var line in translations[section]) {
            var element = document.getElementById(section + "-" + line);
            if (element) {
                element.innerText = translations[section][line][lang];
            }
        }
    }
}

const insertPhone = () => {
    var element = document.getElementById("contact-details-phone-nr");
    if (element) {
        element.innerText = '+43 (0)670 2042800';
    }
}

const insertPic = () => {
    const pictures = document.getElementsByClassName('picture');
    const place = !!window.matchMedia("(max-width: 799px)").matches ? pictures[0] : pictures[1];

    place.style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJcAAAC9CAYAAAC+qO8pAAAAAXNSR0IArs4c6QAAIABJREFUeF7t3Qnc9ulc///rFlmiokhFZQspbSQ7RUKMdawzIwzZDWMZy4RsgxmD7NvYjVH2EMoyCZGEkMrWQlpoUdrO/+P5fdyv+/+Z03Xf13Xfc9/3DL85H4/rcZ7X93t8j+XzeR+f7fgcx3fHxlmfsyhwgCiw4wDVe1a1Z1Fg4yxwnQWCA0aBs8B1wEh7VsVngessDBwwCvw/Ba5XvepVq0MPPfSAjvn4449f/c///M/Ggx70oAPazgFDxH6s+FuOAC984QtXn//85ze++MUvbjzzmc88zfiOOeaY1Re+8IWNa1/72ht3utOdTtfYAfWv/uqvNr7zO79z44IXvODGLW95y131bQbil73sZavb3e52p6vN/cj3g1LVt9Rgf+mXfml14xvfeOP85z//xu4YefLJJ68+/vGPb5Auyj3gAQ/YKxo897nPXX3lK19ZnlPXrW51q9M8//KXv3z1wQ9+cON7v/d7N37oh35o42//9m83HvjAB+5VGweF8wehkW+ZQd/kJjdZ/cIv/MLGve99728Y00te8pLVYYcd9g3X73nPe64uf/nLb/zZn/3ZxoknnrglLe5973uvzne+82085jGP2XG3u91t9b//+78b3/M937PxL//yLxsARWKe85zn3Pi///u/jf/+7//eONvZzrbx9a9/fePHfuzHNn7wB39wA/Bvc5vbbNnOQeD7QWniW2Kgd77znVdvectbNu585ztvPOIRj9g1pmc/+9kLGP75n/95ISamf/nLX964xCUusXHEEUfsKvf4xz9+9eAHP3iPtCCxqNRHPepRO25961svqheQ/vIv/3LjXOc61wIw0vC85z3vxmq1WtrasWPH8pvq1O63f/u3b1zykpfc+Jmf+ZmNE0444VuC9ntC6Tf9AG93u9ut2FfveMc7TjMWwHr3u9+98Z//+Z+LBPn3f//3je/4ju9YvoHt0pe+9AIyACGBlCF9TjnllG+gydOe9rTVpz/96Y0LX/jCG0D813/914tkOve5z73UB1A+Zz/72Zc/9QVm/wPVf/3Xfy19+epXv7qA8Md//Mc3fvZnf3bj537u5zZufetb72rzxS9+8erwww//pueL8X/TDuLEE09cDOoPfOADG+973/uWcdzr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')";
}