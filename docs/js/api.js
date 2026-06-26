// IIFE (Immediately Invoked Function Expression) of
// private calls to ubkg-api endpoints.

(function (window) {

  // Access the global app workspace.
  window.App = window.App || {};

  // Original function name preserved for compatibility.
  // Guesdt wraps a UBKG-API endpoint with an authorization header.
  function Guesdt(eJSON, callback) {
    d3.request(sessionStorage.getItem("UBKG-server") + eJSON)
      .header("Content-Type", "application/json; charset=UTF-8")
      .header("Accept", "application/json; charset=UTF-8")
      .header("Authorization", "UMLS-key " + sessionStorage.getItem("UMLS-key"))
      .send("GET", function (error, data) {
        callback(error, data);
      })
      .response(function (xhr) {
        return xhr.responseText;
      });
  }

  // d3 v4: use d3.queue to chain asynchronous requests.
  function queueGet(path, onDone) {
    const q = d3.queue();
    q.defer(Guesdt, path);
    q.awaitAll(function (error, results) {
      onDone(error, results);
    });
  }

  // Parses JSON responses.
  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

  // Parses the JSON of an asynchronous request response.
  function parseQueueResult(results) {
    if (!results || !results.length) return null;
    return safeJsonParse(results[0], null);
  }

  // Fetches response data that was redirected to a S3 bucket.
  function fetchWith303Support(path, done) {
    queueGet(path, function (error, results) {
      if (error) {
        if (error.target && error.target.status === 303) {
          // API returns S3 URL in response body
          const s3url = error.target.responseText;
          let jsonData = null;

          jQuery.ajax({
            dataType: "json",
            url: `${s3url}`,
            async: false,
            success: function (s3data) {
              jsonData = s3data;
            },
            error: function () {
              jsonData = [];
            }
          });

          done(null, jsonData);
          return;
        }

        done(null, []); // fail-soft
        return;
      }

      const parsed = parseQueueResult(results);
      done(null, parsed == null ? [] : parsed);
    });
  }

  /**
   * Resolve a preferred display term for a code from /codes/{code}/terms.
   * - callback signature: function(resolvedTerm)
   * - fallbackTerm is returned if endpoint is empty/unexpected/error.
   */
  function getPreferredTermForCode(code, fallbackTerm, callback) {
    queueGet("/codes/" + encodeURIComponent(code) + "/terms", function (error, results) {
      if (error) {
        callback(fallbackTerm || "");
        return;
      }

      const termsData = parseQueueResult(results);

      let resolvedTerm = fallbackTerm || "";

      if (Array.isArray(termsData) && termsData.length > 0) {
        // Common shape: [{ code: "...", terms: [{ term: "...", term_type: "..." }] }]
        if (Array.isArray(termsData[0].terms) && termsData[0].terms.length > 0) {
          resolvedTerm = termsData[0].terms[0].term || resolvedTerm;
        }
        // Alternate shape: [{ term: "..." }]
        else if (termsData[0].term) {
          resolvedTerm = termsData[0].term;
        }
      }

      callback(resolvedTerm);
    });
  }

  function getConceptNodeObjects(cui, callback) {
    queueGet("/concepts/" + encodeURIComponent(cui) + "/nodeobjects", function (error, results) {
    if (error) {
      callback(error, null);
      return;
    }

    const data = parseQueueResult(results);
    if (!data || !data.nodeobjects) {
      callback(null, []);
      return;
    }

    callback(null, data.nodeobjects);
  });
}

  // Export private functions to common app namespace.
  window.App.Api = {
    Guesdt,
    queueGet,
    safeJsonParse,
    parseQueueResult,
    fetchWith303Support,
    getPreferredTermForCode,
    getConceptNodeObjects
  };
})(window);