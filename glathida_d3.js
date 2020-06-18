var marked = 'None';
var muted = 0.1;
var unmuted = 0.6;
onchangeData();
interactiveForm();

function plotScatter(xName, yName, dataName) {
  d3.csv('data/' + dataName + '.csv', function (data) {
    data.forEach(function (d) {
      for (var key in d) {
        if (d.hasOwnProperty(key)) {
          d[key] = +d[key];
        }
      }
    });

    dataScat = data.filter(function (d) {
      return (d[yName] != '' && d[xName] != '');
    });

    if (dataScat.length > 500) {
      arr = [];
      for (i = 0; i < dataScat.length; i = i + 2) {
        arr.push(dataScat[i]);
      }

      dataScat = arr;
    }

    var svgScatter = d3.select('.svg-scatter');
    var svgWidth = 800;
    var svgHeight = 420;
    var ratioHW = svgHeight / svgWidth * 100;
    var radius = 5;
    var borders = {
      left: 100,
      right: 15,
      bottom: 50,
      top: 10
    };
    var innerWidth = svgWidth - (borders.left + borders.right);
    var innerHeight = svgHeight - (borders.bottom + borders.top);
    var sColor = '#6200EA';
    svgScatter.selectAll('g')
      .remove();

    svgScatter.selectAll('text')
      .remove();

    var svg = svgScatter.select('svg')
      .attr('width', '100%')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight);

    var yMax = d3.max(dataScat, function (d) {
      return d[yName];
    });

    var yMin = d3.min(dataScat, function (d) {
      return d[yName];
    });

    var xMax = d3.max(dataScat, function (d) {
      return d[xName];
    });

    var xMin = d3.min(dataScat, function (d) {
      return d[xName];
    });

    var addAxes = 0.0;
    var xDom = [xMin - (xMax - xMin) * addAxes, xMax + (xMax - xMin) * addAxes];
    var yDom = [yMin - (yMax - yMin) * addAxes, yMax + (yMax - yMin) * addAxes];

    var xScale = d3.scaleLinear()
      .domain(xDom)
      .range([0, innerWidth])
      .nice();

    var yScale = d3.scaleLinear()
      .domain(yDom)
      .range([innerHeight, 0])
      .nice();

    var xAxis = d3.axisBottom()
      .scale(xScale)
      .tickSize(-innerHeight);

    var yAxis = d3.axisLeft()
      .scale(yScale)
      .tickSize(-innerWidth);

    var toolTip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-8, 0])
      .html(function (d) {
        return yName + ': ' + d[yName] + '<br>' +
          xName + ': ' + d[xName];
      });

    svg.call(toolTip);

    svg.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(' + borders.left + ',' + borders.top + ')')
      .call(yAxis);

    svg.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(' + borders.left + ',' + (svgHeight - borders.bottom) + ')')
      .call(xAxis);

    var scatter = svg.selectAll('circle')
      .data(dataScat);

    scatter.enter()
      .append('circle')
      .merge(scatter)
      .attr('class', function (d) {
        return 'sct pt' + d.j + '_' + d.i;
      })
      .transition()
      .duration(700)
      .attr('cy', function (d) {
        return yScale(d[yName]);
      })
      .attr('cx', function (d) {
        return xScale(d[xName]);
      })
      .attr('transform', 'translate(' + borders.left + ',' + borders.top + ')');

    scatter.exit()
      .transition()
      .duration(700)
      .attr('r', 0)
      .remove();

    svg.selectAll('circle')
      .attr('r', radius)
      .attr('fill-opacity', unmuted)
      .attr('fill', sColor)
      .attr('stroke', sColor)
      .on('mouseover', onHover)
      .on('mouseout', outHover);

    // y_label
    svg.append('text')
      .classed('label', true)
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2 - borders.top)
      .attr('y', borders.left / 1.5)
      .style('text-anchor', 'middle')
      .text('Ice Thickness [m]');

    // xLabel
    selLabel = document.getElementById('id_x_names');
    xLabel = selLabel.options[selLabel.selectedIndex].text;

    svg.append('text')
      .classed('label', true)
      .attr('x', borders.left + innerWidth / 2.0)
      .attr('y', svgHeight - borders.bottom / 3.0)
      .style('text-anchor', 'middle')
      .text(xLabel);

    // glacier map
    d3.select('.header_map')
      .select('h4')
      .remove();

    d3.select('.glacier_map')
      .select('canvas')
      .remove();

    d3.select('.glacier_map')
      .select('svg')
      .remove();

    var h = d3.max(data, function (d) {
      return d.j;
    }) + 1;

    var w = d3.max(data, function (d) {
      return d.i;
    }) + 1;

    d3.select('.header_map')
      .append('h4')
      .text(dataName);

    var div = d3.selectAll('.glacier_map');
    var canvWidth = div.node().getBoundingClientRect().width;
    var canvas = div.append('canvas')
      .style('width', '100%')
      .attr('id', 'canvas_plot')
      .attr('width', w)
      .attr('height', h);

    var context = canvas.node().getContext('2d');
    var image = context.createImageData(w, h);

    var c = {
      'r': {
        1: 149,
        0: 255,
      },
      'g': {
        1: 119,
        0: 255,
      },
      'b': {
        1: 187,
        0: 255,
      },
    };

    var k = 0;

    for (var l = 0, i = 0; i < data.length; l += 4, i += 1) {
      image.data[l + 0] = c.r[data[i].glacier_mask];
      image.data[l + 1] = c.g[data[i].glacier_mask];
      image.data[l + 2] = c.b[data[i].glacier_mask];
      image.data[l + 3] = 80;
    }

    context.putImageData(image, 0, 0);

    // glacier map scatter
    var scale = canvWidth / w;
    data = data.filter(function (d) {
      return d.thickness != 0;
    });

    var xScaleMap = d3.scaleLinear()
      .domain([0, w - 1])
      .range([1, canvWidth]);

    var yScaleMap = d3.scaleLinear()
      .domain([0, h - 1])
      .range([1, scale * h]);

    var svgMap = d3.select('.glacier_map')
      .append('svg')
      .attr('class', 'plot')
      .attr('id', 'scatter_map')
      .attr('width', '100%')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '0 0 ' + canvWidth + ' ' + scale * h);

    svgMap.selectAll('circle')
      .data(dataScat)
      .enter()
      .append('circle')
      .attr('class', function (d) {
        return 'map pt' + d.j + '_' + d.i;
      })
      .attr('cx', function (d) {
        return xScaleMap(d.i);
      })
      .attr('cy', function (d) {
        return yScaleMap(d.j);
      })
      .attr('r', 2)
      .attr('fill', sColor)
      .on('mouseover', onHover)
      .on('mouseout', outHover);
  });
}

function interactiveForm() {
  selId = ['#id_x_names', '#id_data'];
  for (var i = 0; i < selId.length; i++) {
    var sel = d3.select(selId[i]);
    sel.on('change', onchangeData);
  }
}

function onchangeData() {
  var xName = d3.select('#id_x_names').property('value');
  var yName = 'thickness'; // d3.select('#id_yNames').property('value');
  var data = d3.select('#id_data').property('value');
  plotScatter(xName, yName, data);
}

function onHover(d) {
  // Use D3 to select element, change color and size
  d3.selectAll('.pt' + d.j + '_' + d.i)
    .classed('over', true)
    .raise();
}

function outHover(d) {
  // Use D3 to select element, change color and size
  d3.selectAll('.pt' + d.j + '_' + d.i)
    .classed('over', false);
}