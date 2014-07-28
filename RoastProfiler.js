//dropbox button
var dropBoxOptions = {
  success: readDropBoxFile,
  linkType: 'direct',
  multiselect: false,
  extensions: ['.csv']
  },
  csvData,
  xSize,
  ySize,
  margin = {top: 10, right: 10, bottom: 30, left: 40, internal: 50},
  width,
  height,
  heightTemp,
  heightTempChange,
  x = d3.time.scale(),
  yTemp = d3.scale.linear(),
  yTempChange = d3.scale.linear(),
  xAxis = d3.svg.axis(),
  yAxisTemp = d3.svg.axis(),
  yAxisTempChange = d3.svg.axis(),
  line = d3.svg.line(),
  lineTempChange = d3.svg.line(),
  svg= d3.select("#chart").append("svg"),
  svgTemp = svg.append("g"),
  svgTempChange = svg.append("g"),
  xAxisg = svgTemp.append("g"),
  yAxisTempg = svgTemp.append("g"),
  xAxisTempChangeg = svgTempChange.append("g"),
  yAxisTempChangeg = svgTempChange.append("g"),
  data = [],
  dataTempChange = [],
  colorScale = d3.scale.ordinal().range(colorbrewer.Set1[5]).domain([0, 4])
  ;

function resizeChartArea() {
// responsive variables
xSize = parseInt(d3.select('.chart-area').style('width'));
ySize = window.innerHeight - 80;



console.log(xSize, ySize);

//chart setup
width = xSize - margin.left - margin.right;
height = ySize - margin.top - margin.bottom - margin.internal;
heightTemp = height * 0.65;
heightTempChange = height * 0.35;



x.range([0, width]);

yTemp.range([heightTemp, 0]);

yTempChange.range([heightTempChange, 0]);

xAxis.scale(x)
    .orient("bottom")
    .ticks(d3.time.minutes, 1)
    .tickFormat(d3.time.format('%M'))
    ;

yAxisTemp.scale(yTemp)
    .orient("left")
    .ticks(Math.max(heightTemp/20, 2));

yAxisTempChange.scale(yTempChange)
    .orient("left")
    .ticks(Math.max(heightTempChange/20, 2));;

line.x(function(d) { return x(+d.Time); })
    .y(function(d) { return yTemp(+d.Value1); });

lineTempChange.x(function(d) { return x(+d.Time); })
    .y(function(d) { return yTempChange(+d.Value8); });

svg.attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + margin.internal);

svgTemp.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svgTempChange.attr("transform", "translate(" + margin.left + "," + (margin.top + margin.internal + heightTemp) + ")");

xAxisg.attr("class", "x axis");

yAxisTempg.attr("class", "y axis");

xAxisTempChangeg.attr('class', 'x axis');

yAxisTempChangeg.attr("class", "y axis");

if (data.length > 0) { drawChart(); }


}

function dropBoxOnClick() {
  Dropbox.choose(dropBoxOptions);
}


//filter to exclude data after pull
function excludeDataAfterPull(d) {
  var maxTemp = d3.max(d.filter(function(d) { return (+d.Time > 60); }), function(d) {return +d.Value1; }); // higest temp afer 60 seconds into roast

  //time at max temp
  var maxTempTime = d3.max(
    d.filter(function(d) {return (+d.Time > 60 && +d.Value1 === maxTemp); }), //rows that match temp after 60 sec into roast
    function(d) {return +d.Time + 20;}
    );

  return d.filter(function(d) { return (+d.Time <= maxTempTime);  });

}

function excludeTempChangeDataBefore0(data) {
  var minY = d3.min(data, function(d) {return +d.Value8;}),
    minX = data.filter(function(d) {return +d.Value8 == minY;})[0].Time,
    result = data.filter(function(d) {return (+d.Time > minX && +d.Value8 >= 0);});

    return result;
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
    complete: processCSV,    //callback function
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
    complete: processCSV,    //callback function
    download: true
    }
  );
}

function processCSV(results, file) {
  data.push(excludeDataAfterPull(results.data).map(function(d) {
    d.Time = new Date(2000, 1, 1, 0, Math.floor((+d.Time)/60), +d.Time - (Math.floor((+d.Time)/60) * 60), 0);
    d.Value1 = +d.Value1;
    d.Value8 = +d.Value8;
    return d;
    })
  );

  dataTempChange = data.map(function(d) {return excludeTempChangeDataBefore0(d);})

  // now draw chart
  resizeChartArea();
}

function drawChart() {
  var series,
    seriesTempChange;


    series = svgTemp.selectAll('.line').data(data, function(d, i) {return i;}),
    seriesTempChange = svgTempChange.selectAll('.line').data(dataTempChange, function(d, i) {return i;});

  //format columns to plot


  // console.log('extents', d3.extent(data[0], function(d) { return d.Time; }));
  // colorScale.domain([0, data.length - 1]);
  x.domain(d3.extent(Array.prototype.concat.apply([], data), function(d) { return d.Time; })).ticks(d3.time.minute.utc, 1);
  yTemp.domain(d3.extent(Array.prototype.concat.apply([], data), function(d) { return d.Value1; })).nice();
    // y.domain([0,d3.max(data, function(d) { return d.Value1; })] );

  xAxisg.attr("transform", "translate(0," + heightTemp + ")")
      .transition().duration(1500)
      .call(xAxis);

  yAxisTempg.transition().duration(1500).call(yAxisTemp);
  yAxisTempg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("ºC");



  // entering series
  series.enter()
    .append("path")
    .attr("class", "line")
    .attr("d", line)
    .style('stroke', function(d, i) {return colorScale(i);})
    ;

  // updated series
  series.transition().duration(1500).attr("d", line);

  // exiting series
  series.exit().remove();


//temp change chart
  yTempChange.domain(d3.extent(Array.prototype.concat.apply([], dataTempChange), function(d) { return d.Value8; })).nice();
  // yTempChange.domain([0, d3.max(data, function(d) { return d.Value8; })]).nice();

  xAxisTempChangeg.attr("transform", "translate(0," + heightTempChange + ")")
    .transition().duration(1500)
    .call(xAxis);

  yAxisTempChangeg.transition().duration(1500).call(yAxisTempChange);
  yAxisTempChangeg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end");
    // .text("ºC");

  seriesTempChange.exit().transition().duration(1500).remove;

  seriesTempChange.enter()
    .append("path")
    .attr("class", "line")
    .attr("d", lineTempChange)
    .style('stroke', function(d, i) {return colorScale(i);});

  seriesTempChange.transition().duration(1500).attr("d", lineTempChange);
}

d3.select(window).on('resize', resizeChartArea); 

// console.log(window.innerWidth, window.innerHeight);