const fs = require("fs");

const textoEntrada = fs.readFileSync("texto2.md", "utf8");
console.log(textoEntrada.split("").length);
