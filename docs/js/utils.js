// IIFE (Immediately Invoked Function Expression) containing
// "pure" helpers.

(function (window) {
  window.App = window.App || {};

  function vocabFROMcode(code) {
    return code.substring(0, code.indexOf(":"));
  }

  function codeFROMcode(code) {
    return code.substring(code.indexOf(":") + 1, code.length);
  }

  function parseCodeFromUrl(defaultCode) {
    let CodeIDinURL = false;
    let code = defaultCode;
    const raw = decodeURIComponent(location.search.slice(1)).split("#")[0];

    if (raw.indexOf("CodeID=") > -1) {
      const param = raw.split("CodeID=")[1];
      if (param.indexOf(":") > -1) {
        code = param;
        CodeIDinURL = true;
      }
    }

    const vocab = vocabFROMcode(code);
    return { code, vocab, CodeIDinURL };
  }

  // Export private functions into shared app namespace.
  window.App.Utils = {
    vocabFROMcode,
    codeFROMcode,
    parseCodeFromUrl
  };
})(window);