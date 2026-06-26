// IIFE (Immediately Invoked Function Expression) that
// builds the popup window and hierarchical tree.

(function (window) {

  // Access the global app workspace.
  window.App = window.App || {};

  const Config = window.App.Config;
  const Utils = window.App.Utils;

  // Shared mutable state
  const State = {
    i: 0,
    j: 0,
    k: 0,
    current: d3.zoomIdentity,
    smallTree: null,
    root: null,
    contextMenuShowing: true
  };

  // Share the mutable state with factories
  window.App.State = State;

  // Call the popup factory with the shared state.
  const popup = window.App.PopupFactory.createPopupController(State);

  // Receive popup object with exposed handlers for
  // inline onclick/onkeypress attributes
  window.App.Popup = {
    Term2Codes: popup.Term2Codes,
    Code2Terms: popup.Code2Terms
  };

  // Call the Tree controller with the shared state.
  const treeController = window.App.TreeFactory.createTreeController(State, popup);

  // Initial code/vocab from URL or default
  const parsed = Utils.parseCodeFromUrl(Config.defaultCode);
  const code = parsed.code;
  const vocab = parsed.vocab;

  // Populate popup with default code->terms query
  popup.callpopup(code, "");
  popup.Code2Terms();

  // Start app flow.
  loadInitialRoot(code, vocab);

  function loadInitialRoot(code, vocab) {
    // Get concepts for the code.
    window.App.Api.queueGet(
      "/codes/" + encodeURIComponent(code) + "/concepts",
      function (error, results) {
        const conceptData = window.App.Api.parseQueueResult(results);

        if (!Array.isArray(conceptData) || !conceptData.length || conceptData[0] == null) {
          alert(
            "Selected code in URL is not valid. If you wish to remember the invalid code then select and copy the following: " +
              code +
              " . Click Close to restart with default code."
          );
          location.href = location.pathname;
          return;
        }

        // Multi-concept codes have more than one list element in result.
        if (conceptData[1] != null) {
          let nchildren = 0;

          const smallTree = {
            relation: vocab,
            code: vocab,
            cui: "none",
            term: "Code references more than one Concept.",
            concept: "none",
            stys: [],
            children: []
          };
          // Add a node for each concept that is mapped to the code.
          conceptData.forEach(function (item) {
            smallTree.children.push({
              relation: vocab,
              code:vocab,
              cui: item.concept,
              term: encodeURIComponent(item.prefterm),
              concept: encodeURIComponent(item.prefterm),
              stys: [],
              children: []
            });
            nchildren += 1;
          });

          smallTree.children.sort(function (a, b) {
            return d3.ascending(a.relation + a.term, b.relation + b.term);
          });

          finalizeRoot(smallTree, nchildren);
          return;
        }

        // Single-concept code: resolve display term from /codes/{code}/terms
        window.App.Api.getPreferredTermForCode(
            code,
            conceptData[0].prefterm || "",
            function (resolvedTerm) {
                const encodedTerm = encodeURIComponent(resolvedTerm);

                const smallTree = {
                    relation: vocab,
                    code: vocab,
                    cui: conceptData[0].concept,
                    term: encodedTerm,
                    concept: encodedTerm,
                    stys: [],
                    children: []
                };

                finalizeRoot(smallTree, 0);
          }
        );
      }
    );
  }

  function finalizeRoot(smallTree, nchildren) {

    // Build the local node hierarchy.
    const root = d3.hierarchy(smallTree, function (d) {
      return d.children;
    });

    root.nchildren = nchildren;

    root.descendants().slice(1).forEach(function (d) {
      d.parent = root;
      d.height = 0;
      d.depth = 1;
      d.replicas = [];
    });

    treeController.initRoot(root);
  }
})(window);