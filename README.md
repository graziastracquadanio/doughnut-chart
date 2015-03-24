# doughnut-chart
A custom doughnut char implementation for chart.js that includes a new animation on mouseover.
You can see a demo [here](http://gracegrace.me/#/demos/doughnut-chart).

## Documentation
You can refer to official [Chart.js documentation](http://www.chartjs.org/docs/#doughnut-pie-chart).

## Options
These are the customisation options specific to this Doughnut chart extension. These options are merged with the [global chart configuration options](http://www.chartjs.org/docs/#getting-started-global-chart-configuration).

```javascript
{
    //Number - The width of each segment that we want to add to expand it on mousehover
	extraThickness : 10,
	
    //Boolean - Whether we should show a stroke on each segment
	segmentShowStroke : true,

	//String - The colour of each segment stroke
	segmentStrokeColor : "#fff",

	//Number - The width of each segment stroke
	segmentStrokeWidth : 2,

	//The percentage of the chart that we cut out of the middle.
	percentageInnerCutout : 50,

	//Number - Amount of animation steps
	animationSteps : 100,

	//String - Animation easing effect
	animationEasing : "easeOutBounce",

	//Boolean - Whether we animate the rotation of the Doughnut
	animateRotate : true,

	//Boolean - Whether we animate scaling the Doughnut from the centre
	animateScale : false,

	//String - A legend template
	legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"

}
```

## Licence
This extension is available under the [MIT licence](http://opensource.org/licenses/MIT).
