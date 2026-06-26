// IIFE (Immediately Invoked Function Expression) that
// publishes the Guesdt popup window.

(function (window) {

  // Access the global app workspace.
  window.App = window.App || {};

  // Build the popup controller object.
  function createPopupController(state) {
    state.contextMenuShowing = true;

    function callpopup(code, term) {
      const serverapiurl = sessionStorage.getItem("UBKG-server");

      const popup = d3.select("body")
        .append("div")
        .attr("class", "popup")
        .style("left", "8px")
        .style("top", "8px");

      popup.html("&nbsp" + window.App.Config.titleText + "&nbsp");
      popup.append("input")
        .attr("type", "button")
        .attr("value", "Dismiss")
        .attr("onclick", "window.App.State.contextMenuShowing = false; d3.select('.popup').remove();");

      popup.append("div").text("-------------------------------------------------------------------------------------------------");
      popup.append().text("  ");
      popup.append().text("UBKG API base URL: " + serverapiurl);
      popup.append().text("  ");
      popup.append("div").text("-------------------------------------------------------------------------------------------------");

      popup.append("input")
        .attr("type", "button")
        .attr("value", "Restart tree from selected code")
        .attr("onclick", "window.open(location.pathname + '?CodeID=' + document.getElementById('thecode').value,'_self')");

      popup.append().text("  ");

      popup.append("input")
        .attr("type", "button")
        .attr("value", "Restart default tree")
        .attr("onclick", "window.open(location.pathname,'_self')");

      popup.append("div").text("-------------------------------------------------------------------------------------------------");

      popup.append("input")
        .attr("type", "text")
        .attr("size", "33")
        .attr("value", code || "")
        .attr("id", "thecode")
        .attr("onkeypress", "if(event.which === 13) { window.App.Popup.Code2Terms(); }");

      popup.append().text("  ");

      popup.append("input")
        .attr("type", "button")
        .attr("value", "Code->Terms")
        .attr("onclick", "window.App.Popup.Code2Terms();");

      popup.append("input")
        .attr("type", "text")
        .attr("size", "33")
        .attr("value", term || "")
        .attr("id", "theterm")
        .attr("onkeypress", "if(event.which === 13) { window.App.Popup.Term2Codes(); }")
        .attr("autofocus", "true");

      popup.append().text("  ");

      popup.append("input")
        .attr("type", "button")
        .attr("value", "Term->Codes")
        .attr("onclick", "window.App.Popup.Term2Codes();");

      popup.append("div").text("-------------------------------------------------------------------------------------------------");

      popup.append("div")
        .attr("class", "thecodedisplaydiv")
        .text("")
        .attr("id", "thecodedisplay");

      popup.append("div")
        .attr("class", "spinner")
        .attr("id", "spinner");
    }

    function Term2Codes() {
      const thetermrequest = document.getElementById("theterm").value;
      if (thetermrequest === "") return;

      document.getElementById("thecodedisplay").innerHTML = "Fetching Data...";

      window.App.Api.queueGet(
        "/terms/" + encodeURIComponent(thetermrequest.replaceAll('"', '\\"')) + "/codes",
        function (error, results) {
          const data = window.App.Api.parseQueueResult(results);
          if (!Array.isArray(data)) {
            document.getElementById("thecodedisplay").innerHTML = "No Results";
            return;
          }

          let thetotaltext =
            data.length +
            " Code-Term pair(s) of the Term: " +
            thetermrequest +
            "<table class='result'><tr><td>Code</td><td>TTY</td><td>Term</td></tr>";

          data.forEach(function (item) {
            thetotaltext +=
              "<tr><td onclick='document.getElementById(`thecode`).value=this.innerHTML;document.getElementById(`thecode`).focus();'>" +
              item.code +
              "</td><td>" +
              item.termtype +
              "</td><td onclick='document.getElementById(`theterm`).value=this.innerHTML;document.getElementById(`theterm`).focus();'>" +
              thetermrequest +
              "</td></tr>";
          });

          document.getElementById("thecodedisplay").innerHTML = thetotaltext + "</table>";
        }
      );
    }

    function Code2Terms() {
      const theCodeID = document.getElementById("thecode").value;
      if (theCodeID === "") return;

      document.getElementById("thecodedisplay").innerHTML = "Fetching Data...";

      window.App.Api.queueGet(
        "/codes/" + encodeURIComponent(theCodeID) + "/terms",
        function (error, results) {
          let data = window.App.Api.parseQueueResult(results);

          if (!Array.isArray(data) || data.length === 0) {
            document.getElementById("thecodedisplay").innerHTML = "No Results";
            return;
          }

          if (!data[0].terms || !Array.isArray(data[0].terms)) {
            document.getElementById("thecodedisplay").innerHTML = "No Results";
            return;
          }

          let thetotaltext =
            data[0].terms.length +
            " Code-Term pair(s) for the Code: " +
            data[0].code;

          thetotaltext += "<table class='result'><tr><td>Code</td><td>TTY</td><td>Term</td></tr>";

          data[0].terms.forEach(function (item) {
            thetotaltext +=
              "<tr><td onclick='document.getElementById(`thecode`).value=this.innerHTML;document.getElementById(`thecode`).focus();'>" +
              data[0].code +
              "</td><td>" +
              item.term_type +
              "</td><td onclick='document.getElementById(`theterm`).value=this.innerHTML;document.getElementById(`theterm`).focus();'>" +
              item.term +
              "</td></tr>";
          });

          document.getElementById("thecodedisplay").innerHTML =
            thetotaltext +
            "</table><br />" +
            "<a rel='license' href='http://creativecommons.org/licenses/by/4.0/'><img alt='Creative Commons License' style='border-width:0' src='https://i.creativecommons.org/l/by/4.0/80x15.png' /></a><span xmlns:dct='http://purl.org/dc/terms/' property='dct:title'> Guesdt</span> by <a xmlns:cc='http://creativecommons.org/ns#' href='http://www.computationdoc.com' property='cc:attributionName' rel='cc:attributionURL'>Jonathan C. Silverstein</a> is licensed under a <a rel='license' href='http://creativecommons.org/licenses/by/4.0/''>Creative Commons Attribution 4.0 International License</a>. Based on a work at <a xmlns:dct='http://purl.org/dc/terms/' href='https://d3js.org' rel='dct:source'>https://d3js.org</a>.";
        }
      );
    }

    function showSpinner() {
      const elem = document.createElement("img");
      elem.setAttribute("src", window.App.Config.spinnerGif);
      elem.setAttribute("height", "50");
      elem.setAttribute("width", "50");
      elem.setAttribute("align", "right");
      elem.setAttribute("alt", "Fetching...");
      const spinner = document.getElementById("spinner");
      if (spinner) spinner.appendChild(elem);
    }

    function hideSpinner() {
      const divElement = document.getElementById("spinner");
      if (!divElement) return;
      const images = divElement.querySelectorAll("img");
      images.forEach(function (image) {
        image.remove();
      });
    }

    // Return the object to be consumed by main.js
    return {
      callpopup,
      Term2Codes,
      Code2Terms,
      showSpinner,
      hideSpinner
    };
  }

  // Expose the popup factoy globally for main.js.
  window.App.PopupFactory = { createPopupController };
})(window);