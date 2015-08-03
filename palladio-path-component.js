// Facet filter module

// Most code based on http://bl.ocks.org/hepplerj/e5d3d5787f348cc3b032

angular.module('palladioPathView', ['palladio', 'palladio.services'])
	.directive('palladioPathView', function (palladioService, dataService) {
		return {
			scope : {

			},
			template : '<div id="main">' +
						'<h3 style="font: sans-serif;">Chinese Input &#8212; IN DEVELOPMENT</h3>' +
						'<div id="chart"></div>' +
					'</div>',
			link : {
				pre : function(scope, element) {
					scope.data = {
						nodes: [],
						links: []
					};

				},

				post : function(scope, element, attrs) {
					// Anything that touches the DOM happens here.
					
					var fullData, filteredData;

					var xfilter = dataService.getDataSync().xfilter;
					
					if(xfilter === undefined) { return; }
						
					var dummyDim = xfilter.dimension(function(d) { return true; });

					var width   = 960,
					    height  = 200,
					    margin  = 20,
					    pad     = margin / 2,
					    padding = 10,
					    radius  = 6,
					    yfixed  = pad + radius;

					// Legend variables
					var legend_x = 0,
					    legend_y = 5,
					    legend_width = 175,
					    legend_height = 620,
					    legend_margin = 20,
					    key_y = 40,
					    key_x = 16,
					    mapped_y = legend_y + legend_height - 90;

					var color = d3.scale.category20();

					// Tooltip
					var tooltip = d3.select("body").append("div")
					  .classed("tooltip", true)
					  .classed("hidden", true);
					  
					initialize();
					update();
					
					palladioService.onUpdate("path-component", update);

					// Main
					//-----------------------------------------------------
					function arcDiagram(graph) {
					  var radius = d3.scale.sqrt()
					    .domain([0, 20])
					    .range([0, 15]);

				      // Remove SVG if it already exists (this is a very inefficient way to handle updates...)
					  if(!d3.select(element[0]).select("svg").empty()) {
					    d3.select(element[0]).select("svg").remove();
					  }
					  
					  var svg = d3.select(element[0]).append("svg")
						      .attr("id", "arc")
						      .attr("width", width)
						      .attr("height", height);

					  // create plot within svg
					  var wrapper = svg.append("g")
					    .attr("id", "wrapper")
					    .attr("transform", "translate(" + padding + ", " + padding + ")");

					  // count the paths
					  graph.links.forEach(function(d,i) {
					    var pathCount = 0;
					    for (var j = 0; j < i; j++) {
					      var otherPath = graph.links[j];
					      if (otherPath.source === d.source && otherPath.target === d.target) {
					        pathCount++;
					      }
					    }
					    d.pathCount = pathCount;
					  });

					  // // Create the unique identifiers for the links
					  // graph.links.forEach(function(d,i) {

					  // });

					  // fix graph links to map to objects
					  graph.links.forEach(function(d,i) {
					    d.source = isNaN(d.source) ? d.source : graph.nodes[d.source];
					    d.target = isNaN(d.target) ? d.target : graph.nodes[d.target];
					    d.sessions = ("Session" + d.session + "Trial" + d.trial + "Seg" + d.segment);
					  });

					  linearLayout(graph.nodes);
					  drawLinks(graph.links);
					  drawNodes(graph.nodes);
					}

					// layout nodes linearly
					function linearLayout(nodes) {
					  nodes.sort(function(a,b) {
					    return a.uniq - b.uniq;
					  });

					  var xscale = d3.scale.linear()
					    .domain([0, nodes.length - 1])
					    .range([radius, width - margin - radius]);

					  nodes.forEach(function(d, i) {
					    d.x = xscale(i);
					    d.y = yfixed;
					  });
					}

					function drawNodes(nodes) {

					  var gnodes = d3.select("#wrapper").selectAll("g.node")
					    .data(nodes);

					  var nodeEnter = gnodes.enter()
					    .append('g')
					    .attr("class","gnode");

					  nodeEnter.append("circle")
					    .attr("class", "node")
					    .attr("id", function(d, i) { return d.name; })
					    .attr("cx", function(d, i) { return d.x; })
					    .attr("cy", function(d, i) { return d.y; })
					    .attr("r", 14)
					    .attr("stroke-width","2.5px")
					    .attr("fill","#ffffff")
					    .style("stroke", function(d, i) { return color(d.tokenType); });

					  // Handling mouseover functions
					  // nodeEnter.selectAll(".node")
					  //   .on("mousemove", function(d, i) {
					  //     var mouse = d3.mouse(d3.select("body").node());
					  //     tooltip
					  //       .classed("hidden", false)
					  //       .attr("class", "tooltip")
					  //       .attr("style", "left:" + (mouse[0] + 20) + "px; top:" + (mouse[1] - 50) + "px")
					  //       .html(tooltipText(d));
					  //   });
					    // .on("mouseover", nodeOver);

					  nodeEnter.append("text")
					    .style("text-anchor", "middle")
					    .attr("dx", function(d) { return d.x; })
					    .attr("dy", function(d) { return d.y + 5; })
					    .text(function(d) { return d.token; })
					    .style("font","10px sans-serif");

					  // d3.select("#trial2")
					  //   .on("mouseover", trialOver);
					}

					function drawLinks(links) {
					  var radians = d3.scale.linear()
					    .range([Math.PI / 2, 3 * Math.PI / 2]);

					  var arc = d3.svg.line.radial()
					    .interpolate("basis")
					    .tension(0)
					    .angle(function(d) { return radians(d); });

					  d3.select("#wrapper").selectAll(".link")
					    .data(links)
					  .enter().append("path")
					    .attr("class", "link")
					    .classed("highlighted", false)
					    .attr("id", function(d) { return d.sessions; })
					    .attr("transform", function(d,i) {
					      var xshift = d.source.x + (d.target.x - d.source.x) / 2;
					      var yshift = yfixed;
					      return "translate(" + xshift + ", " + yshift + ")";
					    })
					    .attr("d", function(d,i) {
					      var xdist = Math.abs(d.source.x - d.target.x);
					      arc.radius(xdist / 2);
					      var points = d3.range(0, Math.ceil(xdist / 3));
					      radians.domain([0, points.length - 1]);
					      return arc(points);
					    })
					    .attr("fill","none")
					    .attr("stroke","#888888")
					    .attr("stroke-weight","1px")
					    .attr("stroke-opacity","0.5")
					    .style("stroke-width", function(d) { return (2 + d.pathCount); });
					}

					function tooltipText(d) {
					 return "<h5>Information for " + d.token + "</h5>" +
					   "<table>" +
					   "<tr>" +
					   "<td class='field'>Token: </td>" +
					   "<td>" + d.token + "</td>" +
					   "</tr>" +
					   "<tr>" +
					   "<td class='field'>Dialect: </td>" +
					   "<td>" + d.dialect + "</td>" +
					   "</tr>" +
					   "<tr>" +
					   "<td class='field'>IME: </td>" +
					   "<td>" + d.input_method + "</td>" +
					   "</tr>" +
					   "<tr>" +
					   "<td class='field'>Operating System: </td>" +
					   "<td>" + d.operating_system + "</td>" +
					   "</tr>" +
					   "<tr>" +
					   "<td class='field'>Trial: </td>" +
					   "<td>" + d.trial + "</td>" +
					   "</tr>" +
					   "</table>";
					}

					function segmentHighlight(streamHighlight) {
					  if(d3.selectAll("path").filter(streamHighlight).classed("highlighted") === true){
					    d3.selectAll("path").filter(streamHighlight).classed("highlighted", false);
					  } else {
					    d3.selectAll("path").filter(streamHighlight).classed("highlighted", true);
					  }
					}

					// function resetHighlight() {
					//   d3.selectAll("path").style("display","block");
					// }

					function nodeOver(d,i) {
					  d3.selectAll("path").style("stroke", function (p) {return p.source == d || p.target == d ? "#17becf" : "#888888"})
					}

					function edgeOver(d) {
					  d3.selectAll("path").style("stroke", function(p) {return p == d ? "#17becf" : "#888888"})
					}

					function transition(path) {
					  path.transition()
					    .duration(2500)
					    .attrTween("stroke-dasharray", tweenDash)
					    .each("end", function() { d3.select(this).call(transition); });
					}

					function tweenDash() {
					  var l = this.getTotalLength(),
					      i = d3.interpolateString("0," + l, l + "," + l);
					    return function(t) { return i(t); };
					}
					
					function buildNodesAndLinks() {
						
						fullData = dataService.getDataSync().data;
						filteredData = dummyDim.top(Infinity);
						
						var m = d3.map();
						var mFiltered = d3.map();
					
						fullData.forEach(function(d) {
							// Turn uniq into a number
							d.uniq = +d.uniq;
						})
						
						filteredData.forEach(function(d) {
							// Turn uniq into a number
							d.uniq = +d.uniq;
						})
						
						// First split up the data by trial/session in a map.
						fullData.forEach(function(d) {
							if(m.has([d.trial, d.session])) {
								m.get([d.trial, d.session]).push(d);
							} else {
								m.set([d.trial, d.session], [d]);
							}
						});
						
						filteredData.forEach(function(d) {
							if(mFiltered.has([d.trial, d.session])) {
								mFiltered.get([d.trial, d.session]).push(d);
							} else {
								mFiltered.set([d.trial, d.session], [d]);
							}
						});
						
						// Sort by uniq, convert to character/token combinations, add to graph
						var graph = new Graph();
						m.keys().forEach(function(d) {
							graph.add(m.get(d)
								.sort(function(a,b) { return a.uniq - b.uniq; })
								.map(function(d) {return d.chinese + "," + d.token + "," + d.token_type; }));
						});
						
						// Generate the node ordering using topological sort.
						// !! This won't work if there are any cycles or miscategorized selection keystrokes.
						// Array of node strings for index lookup purposes
						var stringNodeArray = graph.sort();
						// Array of objects for rendering.
						var nodeArray = graph.sort()
							.map(function(d, i) { 
								return { 
									chinese: d.split(",")[0], 
									token: d.split(",")[1],
									tokenType: d.split(",")[2],
									uniq: i
								}; 
							});
	
						scope.data.nodes = nodeArray;
						
						// Now go through all the trials and create our links.
						var linkArray = [];
						mFiltered.keys().forEach(function(d) {
							// Current trial
							var current = m.get(d);
							// Iterate through each keystroke in the current trial
							for(var i=0; i < current.length - 1; i++) {
								// We are not at the end (there is no link at the end)
								linkArray.push({
									source: stringNodeArray.indexOf(current[i].chinese + "," + current[i].token + "," + current[i].token_type),
									target: stringNodeArray.indexOf(current[i+1].chinese + "," + current[i+1].token + "," + current[i+1].token_type),
									session: +current[i].session,
									trial: +current[i].trial,
									segment: 1
								});
							};
						});
						
						scope.data.links = linkArray;						
					}
					
					function initialize() {
						
					}

					function update() {
						buildNodesAndLinks();
						arcDiagram(scope.data);	
					}
				}
			}
		};
	});
