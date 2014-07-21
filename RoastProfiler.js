//dropbox button
var dropBoxOptions = {
	success: readDropBoxFile,
	linkType: 'direct',
	multiselect: false,
	extensions: ['.csv']
	};

function dropBoxOnClick() {
	Dropbox.choose(dropBoxOptions);
}

// var button = Dropbox.createChooseButton(dropBoxOptions);
// document.getElementById("dropBoxButton").appendChild(button);

// globals
var csvData;

// responsive variables
var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    xSize = parseInt(d3.select('.chart-area').style('width')),
    ySize = xSize / 1.618,
    ySizeTempChange = 0.35 * xSize;


//chart setup
var margin = {top: 10, right: 10, bottom: 30, left: 10},
    width = xSize - margin.left - margin.right,
    height = ySize - margin.top - margin.bottom,
    heightTemp = (ySize - margin.top - margin.bottom) * 0.65,
    heightTempChange = (ySize - margin.top - margin.bottom) * 0.35;

var x = d3.time.scale()
    .range([0, width]);

var yTemp = d3.scale.linear()
    .range([heightTemp, 0]);

var yTempChange = d3.scale.linear()
    .range([heightTempChange, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(d3.time.minutes, 1)
    .tickFormat(d3.time.format('%M'))
    ;

var yAxisTemp = d3.svg.axis()
    .scale(yTemp)
    .orient("left")
    .ticks(Math.max(heightTemp/20, 2));

var yAxisTempChange = d3.svg.axis()
    .scale(yTempChange)
    .orient("left");

var line = d3.svg.line()
    .x(function(d) { return x(+d.Time); })
    .y(function(d) { return yTemp(+d.Value1); });

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var svgTemp = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var svgTempChange = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + (margin.top + heightTemp) + ")");

var xAxisg = svgTemp.append("g")
      .attr("class", "x axis");

var yAxisTempg = svgTemp.append("g")
      .attr("class", "y axis");

 //formatter for seconds to mm:ss
 function secondsFormatter(d) {
 	var min = Math.floor((+d)/60);
 	var sec = (+d - (Math.floor((+d)/60) * 60));
 	return min + ':' + ((sec < 10) ? '0' + sec : sec);
 }


//filter to exclude data after pull
function excludeDataAfterPull(d) {
	var maxTemp = d3.max(d.filter(function(d) { return (+d.Time > 60); }), function(d) {return +d.Value1; });	// higest temp afer 60 seconds into roast

	//time at max temp
	var maxTempTime = d3.max(
		d.filter(function(d) {return (+d.Time > 60 && +d.Value1 === maxTemp); }),	//rows that match temp after 60 sec into roast
		function(d) {return +d.Time + 20;}
		);

	return d.filter(function(d) { return (+d.Time <= maxTempTime);  });

}


function readLocalFile() {
	csvData = Papa.parse(document.getElementById('csvFile').files[0], {
		delimiter: "",
		header: true,
		dynamicTyping: false,
		preview: 0,
		step: undefined,
		encoding: "",
		worker: false,
		comments: false,
		complete: drawChart,		//callback function
		download: false
		}
	);

}

function readDropBoxFile(files) {
	console.log(files);
	csvData = Papa.parse(files[0].link, {
		delimiter: "",
		header: true,
		dynamicTyping: false,
		preview: 0,
		step: undefined,
		encoding: "",
		worker: false,
		comments: false,
		complete: drawChart,		//callback function
		download: true
		}
	);
}

function drawChart(results, file) {
	//console.log(results.data);

	var data = excludeDataAfterPull(results.data);

	//format columns to plot
	data.forEach(function(d) {
		d.Time = new Date(2000, 1, 1, 0, Math.floor((+d.Time)/60), +d.Time - (Math.floor((+d.Time)/60) * 60), 0);
		d.Value1 = +d.Value1;
	});

	console.log(data);

	x.domain(d3.extent(data, function(d) { return d.Time; })).ticks(d3.time.minute.utc, 1);
  	yTemp.domain(d3.extent(data, function(d) { return d.Value1; })).nice();
  	// y.domain([0,d3.max(data, function(d) { return d.Value1; })] );

	xAxisg.attr("transform", "translate(0," + heightTemp + ")")
      .call(xAxis);

	yAxisTempg.call(yAxisTemp)
	.append("text")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 6)
	  .attr("dy", ".71em")
	  .style("text-anchor", "end")
	  .text("C");

	var series = svgTemp.selectAll('.line')
	  .data([data]);

	series.exit().remove;

	series.enter()
	  .append("path")
	  .attr("class", "line")
	  .attr("d", line);

	series.attr("d", line);
}