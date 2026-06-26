// IIFE (Immediately Invoked Function Expression) that
// populates the d3 hierarchical tree.

(function (window) {

  // Access the global app workspace.
  window.App = window.App || {};

  // Build tree controller object.
  function createTreeController(state, popup) {

    // Get the global configuration.
    const Config = window.App.Config;

    // Instantiate the tree.
    const tree = d3.tree().nodeSize([Config.nodeheight, Config.nodewidth]);

    // Size the tree.
    const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    const svg = d3.select("body").append("svg")
      .attr("width", w)
      .attr("height", h);

    // Initialize the zoom factor for the tree.
    svg.call(
      d3.zoom()
        .scaleExtent([1 / 20, 10])
        .on("zoom", zoomed)
    );

    const g = svg.append("g");

    function zoomed() {
      state.current = d3.event.transform;
      g.attr("transform", state.current);
    }

    // Replaces null values with the empty string.
    function replaceNull(value) {
        return value == null ? "" : value;
    }


    function normalizeConceptRelations(conceptNodeData, linkedConceptNodeData, done) {

      // Builds a set of normalized child concepts for a concept node.
      // conceptNodeData: a concept node
      // linkedConceptNodeData: a list of concepts that have a relationship with the conceptNodeData node.
      // done: callback that returns the concept node's linked concepts.

      // Number of child nodes
      let nchildren = 0;

      // linkedConceptNodeData contains a mixture of
      // "cross-vocabulary" concepts corresponding to a SAB.
      // "in-vocabulary" concepts that have relationships with the getData node.

      const data = [];
      const SABList = [];

      // Initialize check flags for asynchronous endpoint completion.
      let pending = 0;
      let finished = false;

      // Checks for asynchronous endpoint completion.
      // Returns the done callback only if all asynchronous calls have returned.
      function maybeDone() {
        if (!finished && pending === 0) {
          finished = true;
          data.sort(function (a, b) {
            return d3.ascending(
              (a.relation || "") + (a.term || ""),
              (b.relation || "") + (b.term || "")
            );
          });
          done({ data, nchildren });
        }
      }

      linkedConceptNodeData.forEach(function (item) {

        if (item.sab !== conceptNodeData.data.code) {
          // SAB node. This corresponds to a
          // general relationship between the conceptNodeData concept
          // and a SAB--i.e., there is at least one code from the SAB linked to a concept
          // with a relationship conceptNodeData's concept.

          // This is not the same as a relationship between the conceptNodeData's concept and
          // the SAB for a cross-referenced code (a "node object").

          // Reuse the conceptNodeData concept's CUI and term.
          // Strip "_BASE" from the SABs for UBERON_BASE, PATO_BASE, etc.
          if (SABList.indexOf(item.sab) === -1) {
            data.push({
              relation: item.sab.replace("_BASE",""),
              code: item.sab.replace("_BASE",""),
              cui: conceptNodeData.data.cui,
              term: conceptNodeData.data.term,
              concept: conceptNodeData.data.concept,
              stys: [],
              children: []
            });
            nchildren += 1;
            SABList.push(item.sab);
          }
          return;
        }

        // Build nodes that correspond to a specific relationship
        // between the conceptNodeData concept and another concept.
        const relation = (item.relationship || "").toLowerCase().trim();

        // Build a display term for the linked concept.

        if (item.prefterm == null) {
          // If the concept did not have a preferred term, build
          // a list of preferred terms for codes linked to the concept.

          // First, replace the null preferred term with a blank string.
          let pt = (replaceNull(item.prefterm)).trim();

          // Signal the maybedone check function that the asynchronous call to the nodeobjects
          // endpoint has started.
          pending += 1;

          // Call the nodeObjects endpoint, which will return a set of
          // nodeobjects for the linked concept that includes information
          // on preferred terms of codes that cross-reference the conceptNodeData concept.

          // Note that this is not the same set of codes that are linked
          // to concepts that have relationships with the conceptNodeData concept, which
          // is much larger than the set of nodeobjects.
          window.App.Api.getConceptNodeObjects(item.concept, function (error, nodeobjects) {
            if (!error && Array.isArray(nodeobjects) && nodeobjects.length > 0) {
              let pts = "";

              // Get the preferred terms (TTY=PT) for all codes linked to the concept.
              nodeobjects.forEach(function (nodeobject) {
                const codes = (nodeobject.concept && nodeobject.concept.codes) || [];
                codes.forEach(function (thecode) {
                  const termNames = (thecode.terms || [])
                    .filter(function (t) {
                        return (t.tty || t.term_type || "").toUpperCase() === "PT";})
                    .map(function (t) { return t.name || t.term || ""; })
                    .filter(function (x) { return x !== ""; });

                  // Format as comma-delimited list in parentheses.
                  if (termNames.length > 0) {
                    pts += (pts ? ", " : "") + termNames.join(", ");
                  };
                });
              });

              pts = pts.trim();
              if (pts !== "") pt += " (" + pts + ")";
            }

            // Add the child node.
            data.push({
              relation: relation,
              code: item.sab.replace("_BASE",""),
              cui: item.concept,
              term: encodeURIComponent(pt),
              concept: encodeURIComponent(pt),
              stys: [],
              children: []
            });

            // Signal the maybeDone function that all asynchronous calls have completed.
            nchildren += 1;
            pending -= 1;
            maybeDone();
          });

        } else {

          // Use the preferred term for the linked concept.
          const pt = encodeURIComponent(item.prefterm);
          data.push({
            relation: relation,
            code: item.sab.replace("_BASE",""),
            cui: item.concept,
            term: pt,
            concept: pt,
            stys: [],
            children: []
          });
          nchildren += 1;
        }
      });

      maybeDone();
    }

    function updateData(conceptNodeData) {

      // Populates a section of the hierarchy tree
      // starting from a specified concept node.

      // conceptNodeData: a JSON object with a data key.
      // Example:
      //{
         // "relation": "isa",
         // "code": "CL",
         // "cui": "CL:2000042 CUI",
         // "term": "embryonic%20fibroblast",
         // "concept": "embryonic%20fibroblast",
         // "stys": [],
         //"children": []
      //}

      popup.showSpinner();

      // Get concepts with relations with the specified node.
      // Fetch response data from a stored S3 bucket if the response
      // was redirected to S3.

      // The /concepts/id/concepts endpoint returns concepts that have
      // relationships with the conceptNodeData object. This is different
      // from the set of nodeobjects that describe the codes that
      // cross-reference the concept.

      window.App.Api.fetchWith303Support(
        "/concepts/" + encodeURIComponent(conceptNodeData.data.cui) + "/concepts",
        function (_, responseData) { // BEGIN fetchWith303Support callback
          popup.hideSpinner();

          const linkedConceptNodeData = Array.isArray(responseData) ? responseData : [];

          // Obtain a set of "normalized" child nodes (cross-referenced codes) for the ConceptNodeData concept.
          normalizeConceptRelations(conceptNodeData, linkedConceptNodeData, function (normalized) { // BEGIN normalizeConceptRelations callback

            const data = normalized.data;
            let nchildren = normalized.nchildren;
            let grandChild = 0;

            // Populate the lower levels of the hierarchy.
            if (!(conceptNodeData.children || conceptNodeData._children || data.length < 1)) { // BEGIN if: no existing children and data exists
              const smallTree = { children: data };

              // Sort children alphabetically by relation then term.
              smallTree.children.sort(function (a, b) { // BEGIN sort callback
                return d3.ascending(a.relation + a.term, b.relation + b.term);
              }); // END sort callback

              smallTree.children.forEach(function (d) { // BEGIN children.forEach
                if (d.children) { // BEGIN if d.children
                  d.children.sort(function (a, b) { // BEGIN nested sort callback
                    return d3.ascending(a.relation + a.term, b.relation + b.term);
                  }); // END nested sort callback
                } // END if d.children
              }); // END children.forEach

              // Instantiate the lower level (descendant) hierarchy.

              const smallroot = d3.hierarchy(smallTree, function (d) { // BEGIN hierarchy children accessor
                return d.children;
              }); // END hierarchy children accessor
              conceptNodeData.children = [];
              smallroot.descendants().slice(1).forEach(function (d) { // BEGIN descendants.forEach
                d.parent = conceptNodeData;
                d.height = 0;
                d.depth = conceptNodeData.depth + 1;
                d.replicas = d.replicas || [];
                conceptNodeData.children.push(d);
              }); // END descendants.forEach

              conceptNodeData.nchildren = nchildren;
              conceptNodeData.height = 1 + grandChild;

              // Identify distinct descendants.
              conceptNodeData.descendants().slice(1).forEach(function (d) { // BEGIN replica pass forEach
                if (!d.replicas) d.replicas = [];

                function searchReplicas(s) { // BEGIN searchReplicas
                  if (!s.replicas) s.replicas = [];

                  if (s._children) { // BEGIN if s._children
                    s._children.forEach(searchReplicas);
                  } else if (s.children) { // BEGIN else-if s.children
                    s.children.forEach(searchReplicas);
                  } // END children traversal branch

                  if ( // BEGIN replica match condition
                    d.data.cui === s.data.cui &&
                    d.data.relation === d.data.relation.toLowerCase() &&
                    s.data.relation === s.data.relation.toLowerCase() &&
                    d !== s
                  ) { // BEGIN matched replica branch
                    if (conceptNodeData.parent === s || conceptNodeData.parent === s.parent) { // BEGIN near-parent branch
                      d.replicas.push(d);
                      s.replicas.push(s);
                    } else { // BEGIN non-near-parent branch
                      d.replicas.push(s);
                      s.replicas.push(d);
                    } // END near/non-near-parent branch
                  } // END replica match condition
                } // END searchReplicas

                searchReplicas(state.root);

                // Park collapsed children.
                if (d.parent === conceptNodeData && d.children) { // BEGIN collapse-many branch
                  d._children = d.children;
                  d.children = null;
                } // END collapse-many branch
              }); // END replica pass forEach
            } // END if: no existing children and data exists

            update(conceptNodeData);
          }); // END normalizeConceptRelations callback
        } // END fetchWith303Support callback
      ); // END fetchWith303Support call
    } // END updateData


    function update(source) {

      // Populates and draws the tree for the node.

      // Position of lower left corner.
      if (!source.y0) source.y0 = w / 2;
      if (!source.x0) source.x0 = h / 2;

      // Root node, descendants, and links.
      const treeMap = tree(state.root);
      const nodes = treeMap.descendants();
      const links = treeMap.descendants().slice(1);

      // Reposition nodes relative to the tree's origin.
      const adjustx = source.x - state.root.x;
      const adjusty = source.y - state.root.y;

      nodes.forEach(function (d) {
        d.x = d.x - adjustx - state.current.y / state.current.k + h / 2 / state.current.k;
        d.y = d.y - adjusty - state.current.x / state.current.k + w / 2 / state.current.k;
        d.replicas = d.replicas || [];
      });

      // Set up drawing area for node.
      const node = g.selectAll("g.node")
        .data(nodes, function (d) {
          return d.id || (d.id = ++state.i);
        });

      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", "translate(" + source.y0 + "," + source.x0 + ")");

      // Set up circle icon for node.
      // Add click event for node icon that displays CUI details
      // in the popup.
      nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function (d) {
          return d === source ? "lightsteelblue" : "#fff";
        })
        .on("click", showCuiDef);

      // Style text for term label (to the right of the icon).
      // Add click event for term label that toggles the tree for the node.
      nodeEnter.append("text")
        .attr("class", "termtext")
        .attr("x", 7.4)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(function (d) {
          return unescape((d.data.term || "").slice(0, 50));
        })
        .style("fill", function (d) {
          return (((d.children && d.children.length > Config.MANY) || (d._children && d._children.length > Config.MANY)) ? "red" : "black");
        })
        .on("click", clickterm);

      // Style text for relation label (to the left of the icon).
      // Add click event for relation label that displays SAB details
      // in the popup.
      nodeEnter.append("text")
        .attr("class", "relation")
        .attr("x", -10)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(function (d) {
          return (d.data.relation || "").slice(0, 17);
        })
        .style("fill", function (d) {
          return d.collapsedrelations != null
            ? "red"
            : (Config.preferredInverseBlueRelations.includes(d.data.relation) ? "blue" : "black");
        })
        .on("click", clickrelation);

      // Set up transition animation.
      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate.transition()
        .duration(Config.duration)
        .attr("transform", function (d) {
          return "translate(" + d.y + "," + d.x + ")";
        });

      // Further style the icon: if there are any other "replica" nodes,
      // style as red.
      nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", function (d) {
          return d === source ? "steelblue" : (d.replicas[0] != null ? "red" : "#fff");
        });

     // Further style the node's term label (to the right of the icon):
     // 1. If the text contains parentheses, then it is an ersatz term compiled
     //    from the node's linked codes (and not an actual preferred
     //    term for the concept). Style as gray italic.
     // 2. If the node has more than a specified maximum number of child nodes,
     //    style as red.

      nodeUpdate.select(".termtext")
        .style("fill-opacity", 1)
        .style("font-style", function (d) {
            const txt = decodeURIComponent(d.data.term || "");
            return txt.indexOf("(") !== -1 ? "italic" : "normal";
        })
        .style("fill", function (d) {
            const txt = decodeURIComponent(d.data.term || "");
            const hasParen = txt.indexOf("(") !== -1;
            const tooMany =
                (d.children && d.children.length > Config.MANY) ||
                (d._children && d._children.length > Config.MANY);
            if (hasParen) return "gray";
            return tooMany ? "red" : "black";
        });

      // Further style the node's node label (to the left of the icon).
      // 1. If the node has collapsed child nodes, style as red.
      // 2. If the node label text (the "relation" in data) is uppercase,
      //    then it is for a SAB node. Style as green.

      nodeUpdate.select(".relation")
        .style("fill", function (d) {
          const relation = decodeURIComponent(d.data.relation || "");
          const isSAB = relation === relation.toUpperCase() && relation !== relation.toLowerCase();
          if (isSAB) return "green";
          return d.collapsedrelations != null
            ? "red"
            : (Config.preferredInverseBlueRelations.includes(d.data.relation) ? "blue" : "black");
        });

      // Style the exit transition animation.
      const nodeExit = node.exit().transition()
        .duration(Config.duration)
        .attr("transform", function () {
          return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

      nodeExit.select("circle").attr("r", 1e-6);
      nodeExit.select("text").style("fill-opacity", 1e-6);

      // Style the path line.
      const link = g.selectAll("path.link")
        .data(links, function (d) { return d.id; });

      const linkEnter = link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function () {
          const o = { x: source.x0, y: source.y0 };
          return diagonal(o, o);
        });

      linkEnter.merge(link).transition()
        .duration(Config.duration)
        .attr("d", function (d) {
          return diagonal(d, d.parent);
        });

      link.exit().transition()
        .duration(Config.duration)
        .attr("d", function () {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      const links2 = [];
      links.forEach(function (l) {
        (l.replicas || []).forEach(function (x) {
          const q = Object.create(l);
          q.replica = x;
          links2.push(q);
        });
      });

      const link2 = g.selectAll("path.link2")
        .data(links2, function (d) { return d.id; });

      const linkEnter2 = link2.enter().insert("path", "g")
        .attr("class", "link2")
        .attr("d", function () {
          const o = { x: source.x0, y: source.y0 };
          return diagonal(o, o);
        });

      linkEnter2.merge(link2).transition()
        .duration(Config.duration)
        .attr("d", function (d) {
          return links.indexOf(d.replica) > -1 ? diagonal(d, d.replica) : diagonal(d, d);
        });

      link2.exit().transition()
        .duration(Config.duration)
        .attr("d", function () {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      function diagonal(s, d) {
        return `M ${s.y} ${s.x}
          C ${(s.y + d.y) / 2} ${s.x},
            ${(s.y + d.y) / 2} ${d.x},
            ${d.y} ${d.x}`;
      }

      // Click event on term (label to the right of the icon):
      // Toggles the display of a tree that originates from the clicked node.
      function clickterm(d) {
        if (d.children) {
          // Collapse child nodes and park children.
          d._children = d.children;
          d.children = null;
          update(d);
        } else if (d._children) {
          // Rebuild child nodes and unpark children.
          d.children = d._children;
          d._children = null;
          update(d);
        } else {
          // Build child nodes.
          updateData(d);
        }
      }

      // Click event on relation (label to the left of the icon):
      // 1. For SAB nodes, display source information in the popup.
      // 2. For non-SAB nodes, toggle the display of other nodes at this
      //    level of the hierarchy with the same relation--e..g, if
      //    the relation is "part_of", then hide all other nodes with a
      //    "part_of" relation.

      function clickrelation(d) {
        if (d.data.relation === d.data.code) {
          if (window.App.State.contextMenuShowing === false) {
            popup.callpopup("", "");
            window.App.State.contextMenuShowing = true;
          }

          // Strip any "_BASE" from non-UMLS SABs (e.g., UBERON_BASE; PATO_BASE).
          window.App.Api.queueGet("/sources?sab=" + d.data.relation.replace("_BASE",""), function (error, results) {
            const parsed = window.App.Api.parseQueueResult(results);

            // For UMLS sources, link to the appropriate page in the UMLS site.
            if (!parsed || !parsed.sources || !parsed.sources[0]) {
              window.open(
                "https://www.nlm.nih.gov/research/umls/sourcereleasedocs/current/" + d.data.relation,
                "UMLS Source Information"
              );
              return;
            }

            // For non-UMLS sources, obtain information from the sources endpoint.
            const data = parsed.sources[0];
            let thetotaltext = "<b>Source Abbreviation (SAB): </b>" + data.sab + "<br>";
            thetotaltext += "<b>Name: </b>" + data.name + "<br>";
            thetotaltext += "<b>Description: </b>" + data.description + "<br>";
            thetotaltext += "<b>Home: </b><a href='" + data.home_urls[0] + "'>" + data.home_urls[0] + "</a><br>";
            thetotaltext += "<b>Download File: </b><a href='" + data.source_etl + "'>" + data.source_etl + "</a><br>";
            thetotaltext += "<b>Download Date: </b>" + data.download_date + " ";
            thetotaltext += "<b>Version: </b>" + data.source_version + "<br>";
            thetotaltext += "<b>Citation(s): </b>";
            (data.citations || []).forEach(function (citation) {
              thetotaltext += "<a href='" + citation.url + "'>" + citation.url + "</a> ";
            });
            thetotaltext += "<br><b>Licenses(s): </b>";
            (data.licenses || []).forEach(function (license) {
              thetotaltext += (license.type || "") + " " + (license.subtype || "") + " " + (license.version || "") + "<br>";
            });

            document.getElementById("thecodedisplay").innerHTML = thetotaltext;
          });

          return;
        }

        // Hide other nodes at this level of the hierarchy that have
        // the same relation as the selected node.
        let childrentokeep = [];

        if (d.collapsedrelations == null) {
          d.collapsedrelations = [];
          d.parent.children.forEach(function (s) {
            if (d.data.relation === s.data.relation) {
              d.collapsedrelations.push(s);
              if (s === d) childrentokeep.push(d);
            } else {
              childrentokeep.push(s);
            }
          });
        } else {
          d.parent.children.forEach(function (s) {
            if (s === d) {
              d.collapsedrelations.forEach(function (x) { childrentokeep.push(x); });
            } else {
              childrentokeep.push(s);
            }
          });
          d.collapsedrelations = null;
        }

        d.parent.children = childrentokeep;
        update(d.parent);
      }

      function showCuiDef(d) {
        // Display the detail information associated with the concept,
        // including preferred term, semantic type, and definition.

        if (window.App.State.contextMenuShowing === false) {
          popup.callpopup("", "");
          window.App.State.contextMenuShowing = true;
        }

        window.App.Api.getConceptNodeObjects(d.data.cui, function (error, nodeobjects) {
            if (error || !Array.isArray(nodeobjects) || nodeobjects.length === 0) return;

            let thetotaltext = "";

            nodeobjects.forEach(function (nodeobject) {

              //thetotaltext = "<b>Concept Unique ID: </b>" + nodeobject.node.cui + "<br>";
              thetotaltext = "<b>Concept Unique ID: </b>" + nodeobject.concept.cui + "<br>";

              const pt = nodeobject.concept.pref_term == null
                ? replaceNull(nodeobject.concept.pref_term)
                : nodeobject.concept.pref_term;

              thetotaltext += "<b>Preferred Term: </b>" + pt +  "<br>";
              thetotaltext += "<b>Symantic Types: </b>";

              (nodeobject.concept.semantic_types || []).forEach(function (semantic_type) {
                thetotaltext += semantic_type.stn + ", " + semantic_type.sty + "<br>";
                thetotaltext += semantic_type.def + "<br>";
              });
              thetotaltext += "</br>";

              thetotaltext += "<b>Definitions: </b><br>";
              (nodeobject.concept.definitions || []).forEach(function (definition) {
                thetotaltext += "[" + definition.sab + "] " + definition.def + "<br>";
              });

              thetotaltext += "<table class='result'><tr><td>Code</td><td>TTY</td><td>Term</td></tr>";

              // Display code and term for all codes linked to the concept.

              const codes = nodeobject.concept.codes || [];
              codes.sort(function (a, b) {
                const nameA = (a.codeid || "").toUpperCase();
                const nameB = (b.codeid || "").toUpperCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
              });

              codes.forEach(function (thecode) {
                (thecode.terms || []).forEach(function (item) {
                  thetotaltext +=
                    "<tr><td onclick='document.getElementById(`thecode`).value=this.innerHTML;document.getElementById(`thecode`).focus();'>" +
                    thecode.codeid +
                    "</td><td>" +
                    item.tty +
                    "</td><td onclick='document.getElementById(`theterm`).value=this.innerHTML;document.getElementById(`theterm`).focus();'>" +
                    item.name +
                    "</td></tr>";
                });
              });

              thetotaltext += "</table>";
            });

            document.getElementById("thecodedisplay").innerHTML = thetotaltext;
          }
        );
      }
    }

    function initRoot(root) {
      state.root = root;
      updateData(state.root);
    }

    // Return the object to be consumed by main.js.
    return {
      initRoot,
      updateData
    };
  }

  // Expose the tree factory globally for main.js.
  window.App.TreeFactory = { createTreeController };
})(window);