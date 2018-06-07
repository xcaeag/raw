(function() {

    var points = raw.models.points();

    var chart = raw.chart()
        .title('Scatter Plot')
        .description(
            "A scatter plot, scatterplot, or scattergraph is a type of mathematical diagram using Cartesian coordinates to display values for two variables for a set of data. The data is displayed as a collection of points, each having the value of one variable determining the position on the horizontal axis and the value of the other variable determining the position on the vertical axis. This kind of plot is also called a scatter chart, scattergram, scatter diagram, or scatter graph.")
        .thumbnail("imgs/scatterPlot.png")
        .category('Dispersion')
        .model(points);

    var width = chart.number()
        .title("Width")
        .defaultValue(1000)
        .fitToWidth(true);

    var height = chart.number()
        .title("Height")
        .defaultValue(500);

    var maxRadius = chart.number()
        .title("max radius")
        .defaultValue(7);

    var useZero = chart.checkbox()
        .title("set origin at (0,0)")
        .defaultValue(false);

    var colors = chart.color()
        .title("Color scale");

    var showPoints = chart.checkbox()
        .title("show points")
        .defaultValue(true);

    chart.draw((selection, data) => {

        // Retrieving dimensions from model
        var x = points.dimensions().get('x'),
            y = points.dimensions().get('y');

        var xExtent = !useZero() ? d3.extent(data, d => {
                return d.x;
            }) : [0, d3.max(data, d => {
                return d.x;
            })],
            yExtent = !useZero() ? d3.extent(data, d => {
                return d.y;
            }) : [0, d3.max(data, d => {
                return d.y;
            })];

        var sizeScale = d3.scaleLinear()
            .range([1, Math.pow(+maxRadius(), 2) * Math.PI])
            .domain([0, d3.max(data, d => {
                return d.size;
            })])

        //define margins
        var margin = {
            top: maxRadius() + 5,
            right: maxRadius() + 5,
            bottom: maxRadius() + 5,
            left: maxRadius() + 5
        };

        var w = width() - margin.left - margin.right,
            h = height() - margin.top - margin.bottom;

        var g = selection
            .attr("width", +width())
            .attr("height", +height())
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var xScale = x.type() == "Date" ? d3.scaleTime() : d3.scaleLinear();
        xScale.range([0, w]).domain(xExtent)
        xAxis = d3.axisBottom(xScale).ticks(10).tickSize(-h);

        var yScale = y.type() == "Date" ? d3.scaleTime() : d3.scaleLinear();
        yScale.range([h, 0]).domain(yExtent);
        var yAxis = d3.axisLeft(yScale).ticks(10).tickSize(-w);

        g.append("g")
            .attr("class", "x axis")
            .style("stroke-width", "1px")
            .style("font-size", "10px")
            .style("font-family", "Arial, Helvetica")

        d3.select('.x.axis').attr("transform", `translate(0, ${h})`).call(xAxis);

        g.append("g")
            .attr("class", "y axis")
            .style("stroke-width", "1px")
            .style("font-size", "10px")
            .style("font-family", "Arial, Helvetica")

        d3.select('.y.axis').call(yAxis);

        // get the labels width and update margins
        d3.selectAll('.y.axis .tick > text').each(function(d, i) {
            let thisWidth = d3.select(this).node().getBBox().width + 10;
            margin.left = d3.max([margin.left, thisWidth]);
        })

        d3.select('.x.axis .tick:last-child').each(function(d,i){
            let thisX = d3.select(this).attr('transform').split('(')[1].split(',')[0];
            // Check if the most right placed horizontal tick is placed on the right margin
            if (Math.round(xScale.range()[1]*0.1) <= Math.round(thisX*0.1)) {
                let thisWidth = d3.select(this).select('text').node().getBBox().width + 10;
                margin.right = d3.max([margin.right, thisWidth/2]);
            }
            // always readapt the bottom margin
            let thisHeight = d3.select(this).select('text').node().getBBox().height + 5;
            margin.bottom = d3.max([margin.bottom, thisHeight]);
        })

        // update chart dimentions
        w = width() - margin.left - margin.right;
        h = height() - margin.bottom - margin.top;

        // update position of g
        g.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // update scales and axis
        xScale.range([0, w]);
        xAxis.tickSize(-h);

        yScale.range([h, 0]);
        yAxis.tickSize(-w);

        // redraw axis
        d3.select('.x.axis').attr("transform", `translate(0, ${h})`).call(xAxis);
        d3.select('.y.axis').call(yAxis);

        d3.selectAll(".y.axis line, .x.axis line, .y.axis path, .x.axis path")
            .style("shape-rendering", "crispEdges")
            .style("fill", "none")
            .style("stroke", "#ccc");

        var circle = g.selectAll("g.circle")
            .data(data)
            .enter().append("g")
            .attr("class", "circle");

        var point = g.selectAll("g.point")
            .data(data)
            .enter().append("g")
            .attr("class", "point")

        colors.domain(data, d => {
            return d.color;
        });

        circle.append("circle")
            .style("fill", d => {
                return colors() ? colors()(d.color) : "#eeeeee";
            })
            .style("fill-opacity", .9)
            .attr("transform", d => {
                return `translate(${xScale(d.x)}, ${yScale(d.y)})`;
            })
            .attr("r", d => {
                return Math.sqrt(sizeScale(d.size) / Math.PI);
            });

        point.append("circle")
            .filter(d => {
                return showPoints();
            })
            .style("fill", "#000")
            .attr("transform", d => {
                return `translate(${xScale(d.x)}, ${yScale(d.y)})`;
            })
            .attr("r", 1);

        circle.append("text")
            .attr("transform", d => {
                return `translate(${xScale(d.x)}, ${yScale(d.y)})`;
            })
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .attr("dy", 15)
            .style("font-family", "Arial, Helvetica")
            .text(d => {
                return d.label ? d.label.join(", ") : "";
            });

    })

})();