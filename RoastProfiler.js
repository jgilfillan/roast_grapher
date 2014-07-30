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
  heightRoR,
  x = d3.time.scale(),
  yTemp = d3.scale.linear(),
  yRoR = d3.scale.linear(),
  xAxis = d3.svg.axis(),
  yAxisTemp = d3.svg.axis(),
  xAxisRoR = d3.svg.axis(),
  yAxisRoR = d3.svg.axis(),
  line = d3.svg.line(),
  lineRoR = d3.svg.line(),
  svg= d3.select("#chart").append("svg"),
  svgTemp = svg.append("g"),
  svgRoR = svg.append("g"),
  xAxisGrid = svgTemp.append("g").attr("class", "x axis grid-x"),
  yAxisTempGrid = svgTemp.append("g").attr("class", "y axis grid-y"),
  xAxisg = svgTemp.append("g").attr("class", "x axis"),
  yAxisTempg = svgTemp.append("g").attr("class", "y axis"),
  xAxisRoRGrid = svgRoR.append("g").attr('class', 'x axis grid-x'),
  yAxisRoRGrid = svgRoR.append("g").attr('class', 'y axis grid-y'),
  xAxisRoRg = svgRoR.append("g").attr('class', 'x axis'),
  yAxisRoRg = svgRoR.append("g").attr('class', 'y axis'),
  data = [],
  dataRoR = [],
  colorScale = d3.scale.ordinal().range(colorbrewer.Set1[5]).domain([0, 4])
  ;

function resizeChartArea() {
  // responsive variables
  xSize = parseInt(d3.select('.chart-area').style('width'));
  ySize = document.documentElement.clientHeight - 60;

  //chart setup
  width = xSize - margin.left - margin.right;
  height = ySize - margin.top - margin.bottom - margin.internal;
  heightTemp = height * 0.65;
  heightRoR = height * 0.35;

  x.range([0, width]);

  yTemp.range([heightTemp, 0]);

  yRoR.range([heightRoR, 0]);

  xAxis.scale(x)
      .orient("bottom")
      .ticks(d3.time.minutes, 1)
      .tickFormat(d3.time.format('%M'))
      ;

  yAxisTemp.scale(yTemp)
      .orient("left")
      .ticks(Math.max(heightTemp/20, 2));

  xAxisRoR.scale(x)
    .orient("bottom")
    .ticks(d3.time.minutes, 1)
    .tickFormat(d3.time.format('%M'))
    ;

  yAxisRoR.scale(yRoR)
      .orient("left")
      .ticks(Math.max(heightRoR/20, 2));;

  line.x(function(d) { return x(+d.Time); })
      .y(function(d) { return yTemp(+d.Value1); });

  lineRoR.x(function(d) { return x(+d.Time); })
      .y(function(d) { return yRoR(+d.Value8); });

  svg.attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + margin.internal);

  svgTemp.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svgRoR.attr("transform", "translate(" + margin.left + "," + (margin.top + margin.internal + heightTemp) + ")");

  // xAxisg.attr("class", "x axis");

  // yAxisTempg.attr("class", "y axis");

  // xAxisRoRg;

  // yAxisRoRg.attr("class", "y axis");

  //only draw chart if there is data
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

function excludeRoRDataBefore0(data) {
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


// function addCSV(fileName) {
//   return function(results, file) {
//     data.push(excludeDataAfterPull(results.data).map(function(d) {
//       d.Time = new Date(2000, 1, 1, 0, Math.floor((+d.Time)/60), +d.Time - (Math.floor((+d.Time)/60) * 60), 0);
//       d.Value1 = +d.Value1;
//       d.Value8 = +d.Value8;
//       return {fileName: fileName, data: d};
//       })
//     );

//     dataRoR = data.map(function(d) {return excludeRoRDataBefore0(d);})

//     // now resize char area and draw chart
//     resizeChartArea();
//   };
// }

function processCSV(results, file) {


  data.push(excludeDataAfterPull(results.data).map(function(d) {
    d.Time = new Date(2000, 1, 1, 0, Math.floor((+d.Time)/60), +d.Time - (Math.floor((+d.Time)/60) * 60), 0);
    d.Value1 = +d.Value1;
    d.Value8 = +d.Value8;
    return d;
    })
  );

  dataRoR = data.map(function(d) {return excludeRoRDataBefore0(d);})

  // now resize char area and draw chart
  resizeChartArea();
}

function drawChart() {
  var series,
      seriesRoR;

  series = svgTemp.selectAll('.line').data(data, function(d, i) {return i;}),
  seriesRoR = svgRoR.selectAll('.line').data(dataRoR, function(d, i) {return i;});

  x.domain(d3.extent(Array.prototype.concat.apply([], data), function(d) { return d.Time; })).ticks(d3.time.minute.utc, 1);
  yTemp.domain(d3.extent(Array.prototype.concat.apply([], data), function(d) { return d.Value1; })).nice();

  if (xAxisg.attr('transform')) {
  xAxisg.transition().duration(1500)
      .attr("transform", "translate(0," + heightTemp + ")")
      .call(xAxis.tickSize(null).tickFormat(d3.time.format('%M')));
  }
  else {
    xAxisg.attr("transform", "translate(0," + heightTemp + ")")
      .call(xAxis.tickSize(null).tickFormat(d3.time.format('%M')));
  }

  yAxisTempg.transition().duration(1500).call(yAxisTemp.tickSize(null).tickFormat(null));
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
  yRoR.domain(d3.extent(Array.prototype.concat.apply([], dataRoR), function(d) { return d.Value8; })).nice();

  xAxisRoRg.attr("transform", "translate(0," + heightRoR + ")")
    .transition().duration(1500)
    .call(xAxisRoR.tickSize(null).tickFormat(d3.time.format('%M')));

  yAxisRoRg.transition().duration(1500).call(yAxisRoR.tickSize(null).tickFormat(null));
  // yAxisRoRg.append("text")
  //   .attr("transform", "rotate(-90)")
  //   .attr("y", 6)
  //   .attr("dy", ".71em")
  //   .style("text-anchor", "end");
    // .text("ºC");

  seriesRoR.exit().transition().duration(1500).remove;

  seriesRoR.enter()
    .append("path")
    .attr("class", "line")
    .attr("d", lineRoR)
    .style('stroke', function(d, i) {return colorScale(i);});

  seriesRoR.transition().duration(1500).attr("d", lineRoR);

  //grid lines
  

yAxisTempGrid.transition().duration(1500).call(yAxisTemp.tickSize(-width, 0, 0).tickFormat(""));

if (xAxisGrid.attr("transform")) {
  xAxisGrid.transition().duration(1500).attr("transform", "translate(0," + heightTemp + ")").call(xAxis.tickSize(-heightTemp, 0, 0).tickFormat(""));
}
else {
  xAxisGrid.attr("transform", "translate(0," + heightTemp + ")").call(xAxis.tickSize(-heightTemp, 0, 0).tickFormat(""));
}

yAxisRoRGrid.transition().duration(1500).call(yAxisRoR.tickSize(-width, 0, 0).tickFormat(""));
xAxisRoRGrid.attr("transform", "translate(0," + heightRoR + ")").transition().duration(1500).call(xAxisRoR.tickSize(-heightRoR, 0, 0).tickFormat(""));
}

d3.select(window).on('resize', resizeChartArea); 
