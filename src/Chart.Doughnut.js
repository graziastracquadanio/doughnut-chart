(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		//Cache a local reference to Chart.helpers
		helpers = Chart.helpers;

	var defaultConfig = {
		//Boolean - Whether we should show a stroke on each segment
		segmentShowStroke : true,

		//String - The colour of each segment stroke
		segmentStrokeColor : "#fff",

		//Number - The width of each segment stroke
		segmentStrokeWidth : 2,

		//The percentage of the chart that we cut out of the middle.
		percentageInnerCutout : 50,

		//Number - The width of each segment that we want to add to expand it on mousehover
		extraThickness : 10,

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

	};


	Chart.Type.extend({
		//Passing in a name registers this chart in the Chart namespace
		name: "Doughnut",
		//Providing a defaults will also register the deafults in the chart namespace
		defaults : defaultConfig,
		//Initialize is fired when the chart is initialized - Data is passed in as a parameter
		//Config is automatically merged by the core of Chart.js, and is available at this.options
		initialize:  function(data){

			//Declare segments as a static property to prevent inheriting across the Chart type prototype
			this.segments = [];

			this.outerRadius = (helpers.min([this.chart.width,this.chart.height]) - (this.options.extraThickness * 2) - this.options.segmentStrokeWidth/2)/2;

			this.SegmentArc = Chart.Arc.extend({
				ctx : this.chart.ctx,
				x : this.chart.width/2,
				y : this.chart.height/2
			});

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activeSegments = (evt.type !== 'mouseout') ? this.getSegmentsAtEvent(evt) : [];

					helpers.each(this.segments,function(segment){
						segment.restore(["fillColor"]);
					});
					helpers.each(activeSegments,function(activeSegment){
						activeSegment.fillColor = activeSegment.highlightColor;
					});
					this.showTooltip(activeSegments);
				});
			}
			this.calculateTotal(data);

			helpers.each(data,function(datapoint, index){
				this.addData(datapoint, index, true);
			},this);

			this.loaded = false;

			this.render();
		},
		getSegmentsAtEvent : function(e){
			var segmentsArray = [];

			var location = helpers.getRelativePosition(e);

			helpers.each(this.segments,function(segment){
				if (segment.inRange(location.x,location.y)) segmentsArray.push(segment);
			},this);
			return segmentsArray;
		},
		addData : function(segment, atIndex, silent){
			var index = atIndex || this.segments.length;
			this.segments.splice(index, 0, new this.SegmentArc({
				value : segment.value,
				outerRadius : (this.options.animateScale) ? 0 : this.outerRadius,
				innerRadius : (this.options.animateScale) ? 0 : (this.outerRadius/100) * this.options.percentageInnerCutout,
				fillColor : segment.color,
				highlightColor : segment.highlight || segment.color,
				showStroke : this.options.segmentShowStroke,
				strokeWidth : this.options.segmentStrokeWidth,
				strokeColor : this.options.segmentStrokeColor,
				startAngle : Math.PI * 1.5,
				circumference : (this.options.animateRotate) ? 0 : this.calculateCircumference(segment.value),
				label : segment.label
			}));
			if (!silent){
				this.reflow();
				this.update();
			}
		},
		calculateCircumference : function(value){
			return (Math.PI*2)*(Math.abs(value) / this.total);
		},
		calculateTotal : function(data){
			this.total = 0;
			helpers.each(data,function(segment){
				this.total += Math.abs(segment.value);
			},this);
		},
		update : function(){
			this.calculateTotal(this.segments);

			// Reset any highlight colours before updating.
			helpers.each(this.activeElements, function(activeElement){
				activeElement.restore(['fillColor']);
			});

			helpers.each(this.segments,function(segment){
				segment.save();
			});
			this.render();
		},
		removeData: function(atIndex){
			var indexToDelete = (helpers.isNumber(atIndex)) ? atIndex : this.segments.length-1;
			this.segments.splice(indexToDelete, 1);
			this.reflow();
			this.update();
		},
		render : function(reflow){
			if (reflow){
				this.reflow();
			}
			if (this.options.animation && !reflow){
				helpers.animationLoop(
					this.draw,
					this.options.animationSteps,
					this.options.animationEasing,
					this.options.onAnimationProgress,
					function() {
						this.loaded = true;
						this.options.onAnimationComplete;
					},
					this
				);
			}
			else{
				this.draw();
				this.options.onAnimationComplete.call(this);
			}
			return this;
		},
		reflow : function(){
			helpers.extend(this.SegmentArc.prototype,{
				x : this.chart.width/2,
				y : this.chart.height/2
			});
			this.outerRadius = (helpers.min([this.chart.width,this.chart.height]) - (this.options.extraThickness * 2) - this.options.segmentStrokeWidth/2)/2;
			helpers.each(this.segments, function(segment){
				segment.update({
					outerRadius : this.outerRadius,
					innerRadius : (this.outerRadius/100) * this.options.percentageInnerCutout
				});
			}, this);
		},
		showTooltip : function(ChartElements, forceRedraw){
			if (this.loaded == false) return;

			// Only redraw the chart if we've actually changed what we're hovering on.
			if (typeof this.activeElements === 'undefined') this.activeElements = [];

			var isChanged = (function(Elements){
				var changed = false;

				if (Elements.length !== this.activeElements.length){
					changed = true;
					return changed;
				}

				helpers.each(Elements, function(element, index){
					if (element !== this.activeElements[index]){
						changed = true;
					}
				}, this);
				return changed;
			}).call(this, ChartElements);

			if (!isChanged && !forceRedraw){
				return;
			}
			else{
				this.activeElements = ChartElements;
			}

			helpers.animationLoop(
				this.draw,
				10,
				"linear",
				this.options.onAnimationProgress,
				function() {
					if(this.options.customTooltips){
						this.options.customTooltips(false);
					}
					if (ChartElements.length > 0){
						// If we have multiple datasets, show a MultiTooltip for all of the data points at that index
						if (this.datasets && this.datasets.length > 1) {
							var dataArray,
								dataIndex;

							for (var i = this.datasets.length - 1; i >= 0; i--) {
								dataArray = this.datasets[i].points || this.datasets[i].bars || this.datasets[i].segments;
								dataIndex = indexOf(dataArray, ChartElements[0]);
								if (dataIndex !== -1){
									break;
								}
							}
							var tooltipLabels = [],
								tooltipColors = [],
								medianPosition = (function(index) {

									// Get all the points at that particular index
									var Elements = [],
										dataCollection,
										xPositions = [],
										yPositions = [],
										xMax,
										yMax,
										xMin,
										yMin;
									helpers.each(this.datasets, function(dataset){
										dataCollection = dataset.points || dataset.bars || dataset.segments;
										if (dataCollection[dataIndex] && dataCollection[dataIndex].hasValue()){
											Elements.push(dataCollection[dataIndex]);
										}
									});

									helpers.each(Elements, function(element) {
										xPositions.push(element.x);
										yPositions.push(element.y);


										//Include any colour information about the element
										tooltipLabels.push(helpers.template(this.options.multiTooltipTemplate, element));
										tooltipColors.push({
											fill: element._saved.fillColor || element.fillColor,
											stroke: element._saved.strokeColor || element.strokeColor
										});

									}, this);

									yMin = min(yPositions);
									yMax = max(yPositions);

									xMin = min(xPositions);
									xMax = max(xPositions);

									return {
										x: (xMin > this.chart.width/2) ? xMin : xMax,
										y: (yMin + yMax)/2
									};
								}).call(this, dataIndex);

							new Chart.MultiTooltip({
								x: medianPosition.x,
								y: medianPosition.y,
								xPadding: this.options.tooltipXPadding,
								yPadding: this.options.tooltipYPadding,
								xOffset: this.options.tooltipXOffset,
								fillColor: this.options.tooltipFillColor,
								textColor: this.options.tooltipFontColor,
								fontFamily: this.options.tooltipFontFamily,
								fontStyle: this.options.tooltipFontStyle,
								fontSize: this.options.tooltipFontSize,
								titleTextColor: this.options.tooltipTitleFontColor,
								titleFontFamily: this.options.tooltipTitleFontFamily,
								titleFontStyle: this.options.tooltipTitleFontStyle,
								titleFontSize: this.options.tooltipTitleFontSize,
								cornerRadius: this.options.tooltipCornerRadius,
								labels: tooltipLabels,
								legendColors: tooltipColors,
								legendColorBackground : this.options.multiTooltipKeyBackground,
								title: ChartElements[0].label,
								chart: this.chart,
								ctx: this.chart.ctx,
								custom: this.options.customTooltips
							}).draw();

						} else {
							helpers.each(ChartElements, function(Element) {
								var tooltipPosition = Element.tooltipPosition();
								new Chart.Tooltip({
									x: Math.round(tooltipPosition.x),
									y: Math.round(tooltipPosition.y),
									xPadding: this.options.tooltipXPadding,
									yPadding: this.options.tooltipYPadding,
									fillColor: this.options.tooltipFillColor,
									textColor: this.options.tooltipFontColor,
									fontFamily: this.options.tooltipFontFamily,
									fontStyle: this.options.tooltipFontStyle,
									fontSize: this.options.tooltipFontSize,
									caretHeight: this.options.tooltipCaretSize,
									cornerRadius: this.options.tooltipCornerRadius,
									text: helpers.template(this.options.tooltipTemplate, Element),
									chart: this.chart,
									custom: this.options.customTooltips
								}).draw();
							}, this);
						}
					}
				},
				this
			);

			return this;
		},
		draw : function(easeDecimal){
			var animDecimal = (easeDecimal) ? easeDecimal : 1;
			this.clear();
			helpers.each(this.segments,function(segment,index){
				if (segment.fillColor == segment.highlightColor) {
					segment.transition({
						outerRadius : this.outerRadius + (this.options.extraThickness * animDecimal)
					},animDecimal);
				} else {
					segment.outerRadius = this.outerRadius;
				}

				if (!this.activeElements) {
					segment.transition({
						circumference : this.calculateCircumference(segment.value),
						outerRadius : this.outerRadius,
						innerRadius : (this.outerRadius/100) * this.options.percentageInnerCutout
					},animDecimal);
				}

				segment.endAngle = segment.startAngle + segment.circumference;

				segment.draw();

				if (index === 0){
					segment.startAngle = Math.PI * 1.5;
				}
				//Check to see if it's the last segment, if not get the next and update the start angle
				if (index < this.segments.length-1){
					this.segments[index+1].startAngle = segment.endAngle;
				}
				
			},this);
		}
	});

	Chart.types.Doughnut.extend({
		name : "Pie",
		defaults : helpers.merge(defaultConfig,{percentageInnerCutout : 0})
	});
}).call(this);