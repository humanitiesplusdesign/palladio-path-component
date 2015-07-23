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
					scope.hardCodedData = hardCodedData();

				},

				post : function(scope, element, attrs) {
					// Anything that touches the DOM happens here.

					console.log(palladioService);
					console.log(dataService);

					var xfilter = dataService.getDataSync().xfilter;
					var fullData = dataService.getDataSync().data;
					var dummyDim = xfilter.dimension(function(d) { return true; });

					var filteredData = dummyDim.top(Infinity);

					var m = d3.map();
					fullData.sort(function(a,b){ return a.uniq > b.uniq; }).forEach(function(d) {
						if(d.chinese) {
							if(m.has([d.chinese, d.trial, d.session])) {
								m.get([d.chinese, d.trial, d.session]).push(d.token);
							} else {
								m.set([d.chinese, d.trial, d.session], [d.token]);
							}
						}
					});

					var characters = [];
					fullData
						.sort(function(a,b){ return a.uniq > b.uniq; })
						.filter(function(d) { return d.trial === '1' && d.session === '2'; })
						.forEach(function(d) {
							if(characters.indexOf(d.chinese) === -1) {
								characters.push(d.chinese);
							}
						});

					var charkeys = d3.map();
					m.entries().forEach(function(d){
						if(charkeys.has(d.key.split(',')[0])){
							charkeys.set(d.key.split(',')[0], charkeys.get(d.key.split(',')[0]).add(d.value));
						} else {
							var graph = new Graph();
							graph.add(d.value);
							charkeys.set(d.key.split(',')[0], graph);
						}
					});

					console.log(charkeys.entries().map(function(d) {
						var test;
						try {
							d.value = d.value.sort();
						} catch(e) {
							// Contains a loop :-(
							d.value = [];
						}
						return d;
					}));

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

					// Main
					//-----------------------------------------------------
					function arcDiagram(graph) {
					  var radius = d3.scale.sqrt()
					    .domain([0, 20])
					    .range([0, 15]);

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
					    .style("stroke", function(d, i) { return color(d.type); });

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

					arcDiagram(scope.hardCodedData);
				}
			}
		};

		function hardCodedData() {
			return {
				"nodes":[
				    {
				        "token": "x",
				        "type": "initial",
				        "uniq": "1",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "ia",
				        "type": "final",
				        "uniq": "2",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "1",
				        "type": "selection",
				        "uniq": "3",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "m",
				        "type": "initial",
				        "uniq": "4",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "a",
				        "type": "final",
				        "uniq": "5",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "1",
				        "type": "selection",
				        "uniq": "6",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "y",
				        "type": "initial",
				        "uniq": "7",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "in",
				        "type": "final",
				        "uniq": "8",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "l",
				        "type": "initial",
				        "uniq": "9",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "iao",
				        "type": "final",
				        "uniq": "10",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "_",
				        "type": "selection",
				        "uniq": "11",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "*",
				        "type": "productive-delete",
				        "uniq": "12",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "j",
				        "type": "initial",
				        "uniq": "13",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "un",
				        "type": "final",
				        "uniq": "14",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "z",
				        "type": "initial",
				        "uniq": "15",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "1",
				        "type": "selection",
				        "uniq": "16",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "*",
				        "type": "productive-delete",
				        "uniq": "17",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "j",
				        "type": "initial",
				        "uniq": "18",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "iu",
				        "type": "final",
				        "uniq": "19",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    },
				    {
				        "token": "1",
				        "type": "selection",
				        "uniq": "20",
				        "age_group": "18-30",
				        "dialect": "cantonese",
				        "gender": "female",
				        "operating_system": "mac",
				        "input_method": "apple",
				        "trial": "2",
				        "chinese": "",
				        "english": ""
				    }
				],
				"links":[
					{
						"source": 0,
						"target": 1,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 0,
						"target": 1,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 0,
						"target": 1,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 0,
						"target": 1,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 0,
						"target": 1,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 0,
						"target": 1,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 1,
						"target": 3,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 1,
						"target": 3,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 1,
						"target": 3,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 1,
						"target": 3,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 1,
						"target": 3,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 1,
						"target": 2,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 2,
						"target": 3,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 3,
						"target": 4,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 3,
						"target": 4,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 3,
						"target": 4,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 3,
						"target": 4,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 3,
						"target": 4,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 3,
						"target": 4,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 4,
						"target": 5,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 4,
						"target": 6,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 4,
						"target": 6,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 4,
						"target": 5,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 4,
						"target": 5,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 4,
						"target": 5,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 5,
						"target": 6,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 5,
						"target": 6,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 5,
						"target": 6,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 5,
						"target": 6,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 6,
						"target": 7,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 6,
						"target": 7,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 6,
						"target": 7,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 6,
						"target": 7,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 6,
						"target": 7,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 6,
						"target": 7,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 7,
						"target": 12,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 7,
						"target": 12,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 7,
						"target": 12,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 7,
						"target": 12,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 7,
						"target": 12,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 7,
						"target": 8,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 8,
						"target": 9,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 9,
						"target": 10,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 10,
						"target": 11,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 11,
						"target": 12,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 12,
						"target": 13,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 12,
						"target": 13,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 12,
						"target": 13,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 12,
						"target": 13,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 12,
						"target": 13,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 12,
						"target": 13,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 13,
						"target": 14,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 14,
						"target": 15,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 15,
						"target": 16,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 16,
						"target": 17,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 13,
						"target": 17,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 13,
						"target": 17,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 13,
						"target": 17,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 13,
						"target": 17,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 13,
						"target": 17,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 17,
						"target": 18,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 17,
						"target": 18,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 17,
						"target": 18,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 17,
						"target": 18,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 17,
						"target": 18,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 17,
						"target": 18,
						"session": 6,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 18,
						"target": 19,
						"session": 1,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 18,
						"target": 19,
						"session": 2,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 18,
						"target": 19,
						"session": 2,
						"trial": 2,
						"segment": 1
					},
					{
						"source": 18,
						"target": 19,
						"session": 5,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 18,
						"target": 19,
						"session": 6,
						"trial": 1,
						"segment": 1
					},
					{
						"source": 18,
						"target": 19,
						"session": 6,
						"trial": 2,
						"segment": 1
					}
					]
				}
			}
	});
