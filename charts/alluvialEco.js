var steps = null;

(function() {

    var graph = raw.models.graph();

    var chart = raw.chart()
        .title('Alluvial Diagram AEAG')
        .description(
            "Derived from Alluvial Diagram, it adds color gradients, labels on nodes and links, some statistical informations.")
        .thumbnail("imgs/alluvialEco.png")
        .category("Multi categorical")
        .model(graph);

    var width = chart.number()
        .title("Largeur")
        .defaultValue(1000)
        .fitToWidth(true);

    var height = chart.number()
        .title("Hauteur")
        .defaultValue(500);

    var nodeWidth = chart.number()
        .title("Largeur des noeuds")
        .defaultValue(50);

    var opacity = chart.number()
        .title("Opacité")
        .defaultValue(.6);

    var showTotal = chart.checkbox()
        .title("Montrer les totaux")
        .defaultValue(true);

    var ignoreU = chart.checkbox()
        .title("Ne pas compter les inconnus")
        .defaultValue(true);

    var colName = chart.list()
        .title('Champ détail');

    var detailLimit = chart.number()
        .title("Limiter le détail à n éléments")
        .defaultValue(2);

    var sortBy = chart.list()
        .title("Trier par")
        .values(['size', 'name', 'automatic', 'value'])
        .defaultValue('value');

    var showSteps = chart.checkbox()
        .title("Voir le nom des étapes")
        .defaultValue(true);

    var showStats = chart.checkbox()
        .title("Voir les statistiques")
        .defaultValue(true);

    var gradientColors = chart.checkbox()
        .title("Dégradé de couleurs")
        .defaultValue(true);

    var darkness = chart.number()
        .title("Assombrissement des boîtes")
        .defaultValue(.3);

    var padding = chart.number()
        .title("Padding factor")
        .defaultValue(0.9);

    chart.draw((selection, data) => {

        var aeagColors = { "1":"#248fd5", "2":"#50c72f", "3":"#f4df3c", "4":"#ff8800", "5":"#f4280f", "U":"#c5c5c5" };
        colName.values(d3.keys(data.dataSource[0]));

        hClass = { 1: 'Très bon', 2: 'Bon', 3: 'Moyen', 4: 'Médiocre', 5: 'Mauvais', U: 'Inconnu' };

        // get the drawing area
        var g = selection
            .attr("width", +width())
            .attr("height", +height() + 20)
            .append("g")
            .attr("transform", "translate(0, 10)");

        // Calculating the best nodePadding (TODO: improve)
        var nested = d3.nest()
            .key(function(d) {
                return d.group;
            })
            .rollup(function(d) {
                return d.length;
            })
            .entries(data.nodes);

        steps = d3.nest()
            .key(function(d) { return d.group; })
            .entries(data.nodes);

        var hSteps = {};
        d3.values(steps)
            .forEach(function(d) {
                hSteps[d.key] = d;
            });

        var maxNodes = d3.max(nested, function(d) {
            return d.values;
        });
        var bestPadding = padding() * d3.min([10, (height() - maxNodes) / maxNodes])

        // create sankey object
        var sankey = d3.sankey()
            .nodeWidth(+nodeWidth())
            .nodePadding(bestPadding)
            .size([+width(), +height()]);

        // use the loaded data
        sankey(data);

        // add values to nodes
        data.nodes.forEach(function(d) {
            // get height for each node
            d.dx = d.x1 - d.x0;
            d.dy = d.y1 - d.y0;

            // check if the name is a number
            if (!isNaN(+d.name)) {
                d.name = +d.name;
            }
        })

        // Re-sorting nodes
        var nested = d3.nest()
            .key(function(d) {
                return d.group;
            })
            .entries(data.nodes)

        // build gradients
        if (gradientColors()) {
            var defs = selection.append("defs");
            // sort by X
            var n = nested.sort(function(a, b) { return d3.ascending(a.values[0].x0, b.values[0].x0); })
            var i = 0;
            n.forEach(function(s) {
                i = i + 1;
                s.values.forEach(function(src) {
                    var j = 0;
                    n.forEach(function(d) {
                        j = j + 1;
                        // treat only the links by progressing to the right
                        if (j == i + 1) {
                            d.values.forEach(function(dst) {
                                if (src.group != dst.group) {
                                    var pk = src.group + src.name + dst.name;
                                    var fromColor = aeagColors[src.name.toString().slice(0,1)];
                                    var toColor = aeagColors[dst.name.toString().slice(0,1)];
                                    // a gradient
                                    var gr = defs.append("linearGradient").attr("id", "g"+pk);
                                    gr.append("stop").attr("style", "stop-color:" + fromColor + ";stop-opacity:1;").attr("offset", "0");
                                    gr.append("stop").attr("style", "stop-color:" + toColor + ";stop-opacity:1;").attr("offset", "1");
                                }
                            });
                        }
                    })
                });
            });
        }

        nested
            .forEach(function(d) {
                var y = (height() - d3.sum(d.values, function(n) {
                    return n.dy + sankey.nodePadding();
                })) / 2 + sankey.nodePadding() / 2;

                d.values.sort(function(a, b) {
                    if (sortBy() == "automatic") return b.y0 - a.y0;
                    if (sortBy() == "size") return b.dy - a.dy;
                    if (sortBy() == "name") {
                        var a1 = typeof a.name,
                            b1 = typeof b.name;
                        return a1 < b1 ? -1 : a1 > b1 ? 1 : a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
                    }
                    if (sortBy() == "value") {
                        return a < b ? -1 : a > b ? 1 : 0;
                    }
                })

                d.values.forEach(function(node) {
                    node.y0 = y;
                    y += node.dy + sankey.nodePadding();
                })
            })

        // Resorting links
        nested.forEach(function(d) {

            d.values.forEach(function(node) {

                var ly = node.y0;

                node.sourceLinks
                    .sort(function(a, b) {
                        return a.target.y0 - b.target.y0;
                    })
                    .forEach(function(link) {
                        link.y0 = ly + link.width / 2 + Math.random();
                        ly += link.width;
                    })

                ly = node.y0;

                node.targetLinks
                    .sort(function(a, b) {
                        return a.source.y0 - b.source.y0;
                    })
                    .forEach(function(link) {
                        link.y1 = ly + link.width / 2 + Math.random();
                        ly += link.width;
                    })
            })
        })

        // prepare link
        var link = g.append("g")
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke-opacity", +opacity())
            .selectAll("path")
            .data(data.links)
            .enter().append("path")
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("id", function(d) { return "p" + d.source.group + d.source.name + d.target.name; })
            .style("stroke", function(d) {
                if (gradientColors()) {
                    return "url('#g" + d.source.group + d.source.name + d.target.name + "')";
                } else {
                    return aeagColors[d.source.name.toString().slice(0,1)];
                }
            })
            .attr("stroke-width", function(d) {
                return Math.max(0.5, d.width);
            });

        // Text over links
        if (colName()) {
            var link = g.append("g").selectAll(".link")
                .data(data.links)
                .enter()
                .append("text")
                .filter(function(d) { return d.value <= detailLimit() && d.value > 0; })
                .style("font-size", "9px")
                .style("font-family", "Arial, Helvetica")
                .style("fill", function(d) { return d3.rgb(aeagColors[d.source.name.toString().slice(0,1)]).darker(3); })
                .append("textPath")
                .attr("xlink:href", function(g) { return "#p" + g.source.group + g.source.name + g.target.name; })
                .attr("startOffset", function(g) {
                    return "" + Math.ceil(70 * Math.random() + 10) + "%";
                })
                .text(function(g) {
                    t = data.dataSource.filter(function(d) { return (d[g.source.group] == g.source.name) && (d[g.target.group] == g.target.name); });
                    lib = t.map(function(d) { return d[colName()]; }).join(" - ");
                    return lib;
                })
                .on("click", function(g) {
                    t = data.dataSource.filter(function(d) { return (d[g.source.group] == g.source.name) && (d[g.target.group] == g.target.name); });
                    for (cd in t) {
                        window.open("http://adour-garonne.eaufrance.fr/evolution/" + t[cd][colName()], "_blank");
                    }
                });
        }


        // prepare node
        var node = g.append("g")
            .attr("class", "nodes")
            .attr("font-family", "Arial, Helvetica")
            .attr("font-size", 10)
            .selectAll("g")
            .data(data.nodes)
            .enter().append("g");

        // add rectangle
        node.append("rect")
            .attr("x", function(d) {
                return d.x0;
            })
            .attr("y", function(d) {
                return d.y0;
            })
            .attr("height", function(d) {
                return d.dy;
            })
            .attr("width", function(d) {
                return d.dx;
            })
            .attr("fill", function(d) {
                return d3.rgb(aeagColors[d.name.toString().slice(0,1)]).darker(darkness());
            })
            .append("title")
            .text(function(d) { return d.name; });


        // sums by node
        d3.values(steps)
            .forEach(function(d) {
                var sum = 0;
                d.values.forEach(function(v) {
                    if ((!ignoreU()) || (ignoreU() && v.name != 'U'))
                        sum += v.value;
                });
                d.sum = sum;
            });


        // nodes labels
        if (showStats()) {
            node.append("text")
            .attr("x", function(d) {
                return d.x0 - 6;
            })
            .attr("y", function(d) {
                return d.y0 + d.dy / 2;
            })
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(function(d) {
                if ((!ignoreU()) || (ignoreU() && d.name != 'U')) {
                    return (d.x0 < nodeWidth()) ?
                        hClass[d.name] + " " + d.value + " (" + (Math.round(10 * 100.0 * d.value / hSteps[d.group].sum) / 10) + "%)" :
                        "" + d.value + " (" + (Math.round(10 * 100.0 * d.value / hSteps[d.group].sum) / 10) + "%)";
                } else {
                    return (d.x0 < nodeWidth()) ? hClass[d.name] + " " + d.value : "" + d.value;
                }
            })
            .attr("fill", function(d) {
                return d3.rgb(aeagColors[d.name.toString().slice(0,1)]).darker(2);
            })
            .filter(function(d) {
                return d.x0 < nodeWidth()
            })
            .attr("x", function(d) {
                return d.x1 + 6;
            })
            .attr("text-anchor", "start");
        }

        if (showSteps()) {
            d3.values(steps)
                .forEach(function(d) {
                    g.append("g")
                        .attr("transform", "translate(" + (d.values[0].x0 + 0.85 * nodeWidth()) + ", " + (height() - 20) + ")")
                        .append("g")
                        .attr("transform", "rotate(-90)")
                        .append("text")
                        .attr("transform", null)
                        .text(d.key.replace("_", " ") + (showTotal() ? " (" + hSteps[d.key].sum + ")" : ""))
                        .style("font-size", (nodeWidth()) + "px")
                        .style("font-weight", "900")
                        .style("font-family", "Arial Black, Heavy")
                        .style("pointer-events", "none")
                        .style("fill", "#FFFFFF")
                        .style("fill-opacity", "1")
                        .style("opacity", "0.6")
                        .style("stroke", "#000000")
                        .style("stroke-opacity", "1")
                        .style("stroke-width", "0.6");
                });
        }
    })

})();