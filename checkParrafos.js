const fs = require("fs");

// Función async principar para poder usar await luego
async function main() {
  // Obtengo el texto del archivo md
  const textoEntrada = fs.readFileSync("texto2.md", "utf8");

  // Se separan los párrafos del texto en un arreglo utilizando el salto de línea como separador y elimino espacios
  const parrafos = textoEntrada.split("\n").filter((p) => p.trim() !== "");

  // Truncar cada párrafo a las primeras 10 palabras
  const parrafosTruncados = parrafos.map((parrafo) => {
    const palabras = parrafo.split(" ");
    // Tomar las primeras 10 palabras o menos si el párrafo tiene menos de 10 palabras
    const truncado = palabras.slice(0, 10).join(" ");
    return truncado;
  });

  // Dividir los fragmentos en trozos de hasta 5000 caracteres (cantidad maxima soportada por la api)
  const fragmentos = dividirEnFragmentos(parrafosTruncados, 4999);

  // Dividir en fragmentos de hasta 5000
  function dividirEnFragmentos(parrafos, limiteCaracteres) {
    const fragmentos = [];
    let fragmentoActual = "";

    parrafos.forEach((parrafo) => {
      // Si el fragmento actual y el párrafo a añadir superan el límite, se crea un nuevo fragmento
      if (fragmentoActual.length + parrafo.length + 1 > limiteCaracteres) {
        fragmentos.push(fragmentoActual);
        fragmentoActual = parrafo; // Empezar nuevo fragmento con el párrafo actual
      } else {
        // Añadir el párrafo al fragmento actual
        fragmentoActual += (fragmentoActual ? "\n" : "") + parrafo;
      }
    });

    // Añadir el último fragmento
    if (fragmentoActual) {
      fragmentos.push(fragmentoActual);
    }

    return fragmentos;
  }

  // Detectar idiomas para cada fragmento
  let detectedLanguages = [];

  for (const fragmento of fragmentos) {
    const parrafosFrag = fragmento.split("\n");
    const idiomasDetectados = await detectLanguages(parrafosFrag);
    console.log(idiomasDetectados);

    detectedLanguages = detectedLanguages.concat(idiomasDetectados);
  }

  // Variables para almacenar los textos de los primeros dos idiomas encontrados
  let primerIdioma = null;
  let segundoIdioma = null;

  // Identificar los dos primeros idiomas distintos
  for (let i = 0; i < detectedLanguages.length; i++) {
    const idioma = detectedLanguages[i];
    if (!primerIdioma && idioma) {
      primerIdioma = idioma;
    } else if (!segundoIdioma && idioma !== primerIdioma) {
      segundoIdioma = idioma;
    }
    if (primerIdioma && segundoIdioma) break;
  }

  // ----------------------------- Se crea objeto que se va a retornar --------------------------
  const output = {
    cantParrafosPrimerTexto: 0,
    cantParrafosSegundoTexto: 0,
    mensajeCantParrafos: "",
  };

  // ----------------------------- Contar párrafos según idioma --------------------------------
  for (let i = 0; i < detectedLanguages.length; i++) {
    const idioma = detectedLanguages[i];

    if (idioma === primerIdioma) {
      output.cantParrafosPrimerTexto++;
    } else if (idioma === segundoIdioma) {
      output.cantParrafosSegundoTexto++;
    }
  }

  // ----------------------------- Cantidad de párrafos -----------------------------------------
  if (output.cantParrafosPrimerTexto === output.cantParrafosSegundoTexto) {
    output.mensajeCantParrafos = "All paragraphs were translated";
  } else {
    output.mensajeCantParrafos = "One or more paragraphs were not translated";
  }

  // ---------------------------------- Objeto de salida ----------------------------------------
  console.log(output);
}

// Función para detectar el idioma utilizando la API de Google
async function detectLanguages(parrafos) {
  const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: parrafos }),
    });

    if (!response.ok) {
      const errorInfo = await response.json();
      console.error("Error en la respuesta de la API:", errorInfo);
      throw new Error("Error en la solicitud a la API de Google");
    }

    const data = await response.json();

    return data.data.detections.map((detection) => detection[0].language);
  } catch (error) {
    console.error("Error en la solicitud a la API de Google:", error);
    throw error;
  }
}

// Ejecutar la función principal
main().catch((error) => {
  console.error("Ocurrió un error:", error);
});
