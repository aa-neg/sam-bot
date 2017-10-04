const qs = require('querystring');
const baseChartURL = 'https://chart.googleapis.com/chart?';

function addTitle(title) {
	return 'chtt=' + encodeURIComponent(title) + "&"
}

function generateLegend(nameArray) {
	if (nameArray.length > 0) {
		let legend = ''

		nameArray.forEach(function(name) {
			legend += name + "|"
		});

		legend = legend.slice(0, -1);

		return 'chdl=' + encodeURIComponent(legend) + '&'
	}

	return '';
}

function generateLineGraphProperties() {
	const barColors = 'chco=f44141,3366ff,00cc66&';
	const barType = 'cht=lxy&';
	const barAxis = 'chxt=x,x,y,y&';

	const axisLabelsPlacement = 'chxp=1,50|3,50&';
	const imageSize = 'chs=700x400&';
	const chartScaling = 'chbh=a&'
	return barColors + barType + barAxis + imageSize +axisLabelsPlacement + chartScaling;
}


function generateBasicBar(xAxisName, yAxisName) {
	const barColors = 'chco=f44141|f47041|f4eb41|b5f441|41f449&';
	const barType = 'cht=bvg&';
	const barAxis = 'chxt=x,x,y,y&';
	const axisLabels = 'chxl=1:|' + encodeURIComponent(xAxisName) + '|3:|' + encodeURIComponent(yAxisName) + '&';
	const axisLabelsPlacement = 'chxp=1,50|3,50&';
	const imageSize = 'chs=700x400&';
	const chartScaling = 'chbh=a&'
	return barColors + barType + barAxis + imageSize + axisLabels + axisLabelsPlacement + chartScaling;
}


function generatePieChart(xAxisName, yAxisName) {
	// const barColors = 'chco=f44141|f47041|f4eb41|b5f441|41f449&';
    
    // const barColors = 'chco=EB3040|C434444|7CF1F2F2|7CFCDA00|7C33C0CC&';
    const barColors = 'chco=EB3040%7C434444%7CF1F2F2%7CFCDA00%7C33C0CC&';

	const barType = 'cht=p3&';
	const barAxis = 'chxt=x&';
	const imageSize = 'chs=700x400&';
	const chartScaling = 'chbh=a&'
	return barColors + barType + barAxis + imageSize  + chartScaling;
}

function populateValues(valueArray) {
	if (valueArray.length > 0) {
		let values = 'chd=t:';
		let highestValue = 0;
		let totalParticipants = 0;
		valueArray.forEach(function(value) {
			if (parseInt(value) > highestValue) {
				highestValue = parseInt(value);
			};
			totalParticipants += parseInt(value);
			values += value + ","
		});

		values = values.slice(0, -1);

		const xScaling = 'chxr=0,1,5|';
		const yScaling = '2,0,' + totalParticipants + ',1'; 
		const scaling = 'chds=0,' + totalParticipants + '&';

		return xScaling + yScaling + '&' + values + '&' + scaling;
	}
}

function populatePieChartValues(valueArray) {
	if (valueArray.length > 0) {
		let values = 'chd=t:';
		let pieLabels = 'chl=';
		let highestValue = 0;
		valueArray.forEach(function(value) {
			if (parseInt(value) > highestValue) {
				highestValue = parseInt(value);
			};
			values += value + ","
			pieLabels += value + "|"
		});

		values = values.slice(0, -1);
		pieLabels = pieLabels.slice(0, -1);

		const scaling = 'chds=0,' + highestValue + '&';

		return pieLabels + '&' + values + '&' + scaling;
	}
}

function formatDate(date) {
    return date[0] + date[1] + "-" + date[2] + date[3] + "-" + date[4] + date[5] + date[6] + date[7]
}


//This is terrible sorry future me...
function populateLineChartValues(valueDict, xAxisName, yAxisName) {
	if (Object.keys(valueDict).length > 0) {
		let values = 'chd=t:';

		let highestValue = 0;
		let legendValues = 'chdl=';

		let scalingAxis = 'chds=';

		let xAxisValueSet = new Set();

		Object.keys(valueDict).forEach(function(question) {
			let line = valueDict[question];
			line.x.forEach(function(value, index) {
				//Shuold probably implement set
				xAxisValueSet.add(value);

				values += (index) + ','

			});

			scalingAxis += '0,' + (xAxisValueSet.size - 1) + ','
			values = values.slice(0, -1);
			values += '|';
			line.y.forEach(function(value) {
				values += value + ','
			});
			values = values.slice(0, -1);
			values += '|';

			//Hard coded max value
			scalingAxis += '0,5,';

			legendValues += encodeURIComponent(line.name) + '|';

		})

		scalingAxis = scalingAxis.slice(0, -1);
		values = values.slice(0, -1);
		legendValues = legendValues.slice(0, -1);

		const axisRanges = 'chxr=0,0,' + (xAxisValueSet.size - 1) +'|2,0,5,1&';

		let xAxisScaleValues = ''

		for (let axisValue of xAxisValueSet) {
			xAxisScaleValues += formatDate(axisValue) + '|';
		}

		xAxisScaleValues = xAxisScaleValues.slice(0, -1);

		const axisLabels = 'chxl=0:|' + xAxisScaleValues + '|1:|' + encodeURIComponent(xAxisName) + '|3:|' + encodeURIComponent(yAxisName) + '&';

		return axisLabels + values + '&' + legendValues + '&' + axisRanges + scalingAxis + '&';
	}
}


function generateBarGraph(title, xAxisLegendValues, xAxisValues, xAxisName, yAxisName) {
	const url = baseChartURL + addTitle(title) + generateBasicBar(xAxisName, yAxisName) + populateValues(xAxisValues) + generateLegend(xAxisLegendValues)
	return url;
}

function generatePieGraph(title, xAxisLegendValues, xAxisValues, xAxisName, yAxisName) {
	const url = baseChartURL + addTitle(title) + generatePieChart(xAxisName, yAxisName) + populatePieChartValues(xAxisValues) + generateLegend(xAxisLegendValues)
	return url;
}

function generateLineGraph(title, lineDicts , xAxisName, yAxisName) {
	const url = baseChartURL + addTitle(title) + populateLineChartValues(lineDicts, xAxisName, yAxisName) + generateLineGraphProperties()

	return url;
}

module.exports = {
	bar: generateBarGraph,
	pie: generatePieGraph,
	line: generateLineGraph
}
