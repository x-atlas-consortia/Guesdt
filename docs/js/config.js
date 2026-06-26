// IIFE (Immediately Invoked Function Expression) to
// set initial configuration constants.

(function (window) {
  window.App = window.App || {};

  const Config = {
    nodeheight: 18,
    nodewidth: 400,
    duration: 100,
    MANY: 64,
    titleText: "Graphing UMLS Enables Search in Dynamic Trees (Guesdt)",
    spinnerGif: "Broken wheel.gif",
    defaultCode: "FMA:7149",
    preferredInverseBlueRelations: [
      "inverse_part_of",
      "inverse_isa",
      "par",
      "inverse_subclass_of",
      "rb",
      "has_part"
    ]
  };

  // Optional defaults (uncomment/set if needed)
  // sessionStorage.setItem("UBKG-server", "https://ontology.api.hubmapconsortium.org");
  // sessionStorage.setItem("UMLS-key", "individual key goes here");

  // Export private config properties to app namespace.
  window.App.Config = Config;
})(window);