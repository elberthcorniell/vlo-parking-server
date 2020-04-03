var unirest = require('unirest');

unirest.get("https://unitag-qr-code-generation.p.rapidapi.com/api?data=%7B%22TYPE%22%3A%22text%22%2C%22DATA%22%3A%7B%22TEXT%22%3A%22Hello+World!%22%7D%7D&setting=%7B%22LAYOUT%22%3A%7B%22COLORBG%22%3A%22ffffff%22%2C%22GRADIENT_TYPE%22%3A%22NO_GR%22%2C%22COLOR1%22%3A%22000000%22%7D%2C%22EYES%22%3A%7B%22EYE_TYPE%22%3A%22Simple%22%7D%2C%22E%22%3A%22M%22%2C%22BODY_TYPE%22%3A0%7D")
.header("X-RapidAPI-Host", "unitag-qr-code-generation.p.rapidapi.com")
.header("X-RapidAPI-Key", "5894bc5db5msh511b6d5ec8979b2p1bcb77jsn25900bab6a75")
.end(function (result) {
  console.log(result.status, result.headers, result.body);
});