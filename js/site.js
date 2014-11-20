data.forEach(function(e){
    e.date = (e.mp_year-2013)*12+e.mp_month;
});

var cf = crossfilter(data);

var mapColors = ['#EF5350','#E98888','#FFCDD2','#BBDEFB','#7AC0F8','#2196F3'];

var byCountry = cf.dimension(function(d){return d.adm0_name;});
var byProduct = cf.dimension(function(d){return d.cm_name;});
var byDate = cf.dimension(function(d){return d.date;});
var byRegion = cf.dimension(function(d){return d.adm1_id;})

var groupByDateCount = byDate.group();
var groupByDateSum = byDate.group().reduceSum(function(d) {return d.mp_price;});
var groupByRegionCount = byRegion.group();
var groupByRegionSum = byRegion.group().reduceSum(function(d){return d.mp_price;})

var currentProduct;
var currentCountry;
var currentAverage;

function filterChartData(country,product){
    byCountry.filterAll();
    byProduct.filterAll();
    byCountry.filterExact(country);
    byProduct.filterExact(product);
    dataCount = groupByDateCount.all();
    dataSum = groupByDateSum.all();
    var data = [];

    dataSum.forEach(function(e,i){
        var value=0;
        if(dataCount[i].value==0){
            value=0;
        } else {
            value = e.value/dataCount[i].value;
        }
        data.push({key:e.key,value:value});
    });
    return data;
}

function filterBarData(bar){
    byCountry.filterAll();
    byProduct.filterAll();
    byDate.filterAll();
    byCountry.filterExact(currentCountry);
    byProduct.filterExact(currentProduct);    
    byDate.filterExact(bar);
    return byDate.top(Infinity);
};

function filterMapData(bar){
    byCountry.filterAll();
    byProduct.filterAll();
    byDate.filterAll();
    byCountry.filterExact(currentCountry);
    byProduct.filterExact(currentProduct);    
    byDate.filterExact(bar); 
    dataCount = groupByRegionCount.all();
    dataSum = groupByRegionSum.all();
    var data = [];
    dataSum.forEach(function(e,i){
        var value=0;
        if(dataCount[i].value==0){
            value=0;
        } else {
            value = e.value/dataCount[i].value;
            value = value/currentAverage;
        }
        data.push({key:e.key,value:value});
    });
    return data;
}

function onCountrySelect(country){
    var html ="";
    var i = 0;
    $('#spark_charts').html(html);
    resetMarketData();
    transitionCountryMap(country);
    products.forEach(function(e){
        if(e.country==country){
            e.products.forEach(function(e){
                $('#spark_charts').append('<p>'+e+'</p><div id="'+e.replace(/\s+/g, '')+'" class="sparkchart"></div>');
                generateSparkBars(e,filterChartData(country,e));
                if(i==0){
                    currentCountry = country;
                    currentProduct = e;
                    d3.select("#"+e.replace(/\s+/g, '')).classed("selected", true);
                    transitionBarChart(filterChartData(country,e));
                    changeTitle();
                    i++;
                }
            });
        }
    });   
}

function generateSparkBars(product,data){
    var id='#'+product.replace(/\s+/g, '');
    var height=$(id).height();
    var width=$(id).width();
    var avg=0;
    var total=0;
    var count=0;
    data.slice(0,12).forEach(function(e){
        if(e.value>0){
            total+=e.value;
            count+=1;
        }
    });
    avg=total/count;
    var datadomain = [];
    data.forEach(function(e){
        e.value-=avg;
        if(e.value!=avg*-1){
            datadomain.push(e.value);
        }
    });
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([0,height]);    
    
    x.domain(data.map(function(d) {return d.key; }));
    var ydomain=d3.extent(datadomain,function(d){return d;});
    y.domain([ydomain[1],ydomain[0]]);
   
    var svg = d3.select(id).append("svg")
        .attr("width", width)
        .attr("height", height)
        .on("click",function(){
                currentProduct = product;
                currentCountry = $('#country_select').val();
                changeTitle();
                resetMarketData();
                transitionBarChart(filterChartData($('#country_select').val(),product));
                changeTitle();
                d3.selectAll(".sparkchart").classed("selected", false);
                d3.select(id).classed("selected", true);
            });

    svg.selectAll("sparkBar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "sparkbar")
            .attr("x", function(d,i) { return x.rangeBand()*i; })
            .attr("width", x.rangeBand()-1)
            .attr("y", function(d){
                        if(d.value==avg*-1){
                            return 0;
                        } else {
                            return y(Math.max(0, d.value));
                        }
            })
            .attr("height", function(d) {
                        if(d.value==avg*-1){
                            return height;
                        } else {
                            return Math.abs(y(d.value) - y(0));
                        }                
            })
            .attr("fill",function(d){
                if(d.value==avg*-1){
                            return "#dddddd";
                } else if(d.value>0) {
                            return "#EF5350";
                } else {
                            return "#2196F3";
                }                     
            });
}

function generateBarChart(data){
    var margin = {top: 10, right: 75, bottom: 30, left: 70},
        width = $("#bar_chart").width() - margin.left - margin.right,
        height =  $("#bar_chart").height() - margin.top - margin.bottom;
    var avg=0;
    var total=0;
    var count=0;
    data.slice(0,12).forEach(function(e){
        if(e.value>0){
            total+=e.value;
            count+=1;
        }
    });
    avg=total/count;
    currentAverage = avg;
    var datadomain = [];
    data.forEach(function(e){
        e.key = keyToYear(e.key);
        if(e.value!=0){
            datadomain.push(e.value);
        }
    });
    
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width]);

    var y = d3.scale.linear()
        .range([0,height]); 

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    xAxis.tickValues(["Jan 13","Mar 13","May 13","Jul 13","Sep 13","Nov 13","Jan 14","Mar 14","May 14","Jul 14","Sep 14"]);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);
    
    x.domain(data.map(function(d) {return d.key; }));
    var ydomain=d3.extent(datadomain,function(d){return d;});
    y.domain([ydomain[1]*1.1,0]);
    
    var svg = d3.select("#bar_chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);    

    svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d,i) { return x(d.key); })
            .attr("width", x.rangeBand()-1)
            .attr("y", function(d){
                        if(d.value==0){
                           return 0;
                        } else {
                           return y(d.value);
                        }                
            })
            .attr("height", function(d) {
                        if(d.value==0){
                           return height;
                        } else {
                            return height-y(d.value);
                        }
            })
            .attr("fill",function(d){
                if(d.value==0){
                            return "#dddddd";
                } else {
                            return "#2196F3";
                }                     
            })
            .on("mouseover",function(d,i){
                data = filterBarData(i+1);
                renderMarketChart(data,i+1);
                data = filterMapData(i+1);
                colorMap(data);
            });            
            
    svg.append("line")
        .attr("x1", 0)
        .attr("y1", y(avg))
        .attr("x2", width)
        .attr("y2", y(avg))
        .attr("stroke-width", 2)
        .attr("stroke", "#EF5350")
        .attr("id","avgline");

    svg.append("text")
            .attr("id", "averagelabel1")
            .attr("x", width+2)
            .attr("y", y(avg))
            .text("2013 country")
            .attr("font-size","12px");
    
    svg.append("text")
            .attr("id", "averagelabel2")
            .attr("x", width+2)
            .attr("y", y(avg)+16)
            .text("average")
            .attr("font-size","12px");
}

function transitionBarChart(data){
    var margin = {top: 10, right: 75, bottom: 30, left: 70},
        width = $("#bar_chart").width() - margin.left - margin.right,
        height =  $("#bar_chart").height() - margin.top - margin.bottom;

    var datadomain = [];
    data.forEach(function(e){
        if(e.value!=0){
            datadomain.push(e.value);
        }
    });
    
    var avg=0;
    var total=0;
    var count=0;    
    
    data.slice(0,12).forEach(function(e){
        if(e.value>0){
            total+=e.value;
            count+=1;
        }
    });
    avg=total/count;    
    currentAverage = avg;
    
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width]);

    var y = d3.scale.linear()
        .range([0,height]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);
    
    x.domain(data.map(function(d) {return d.key; }));
    var ydomain=d3.extent(datadomain,function(d){return d;});
    y.domain([ydomain[1]*1.1,0]);
    
    var svg = d3.select("#bar_chart");
    
    svg.select(".y").transition()
        .call(yAxis); 

    svg.selectAll("rect")
            .data(data)
            .transition()
            .attr("x", function(d,i) { return x(d.key); })
            .attr("width", x.rangeBand()-1)
            .attr("y", function(d){
                        if(d.value==0){
                           return 0;
                        } else {
                           return y(d.value);
                        }
                
            })
            .attr("height", function(d) {
                        if(d.value==0){
                           return height;
                        } else {
                            return height-y(d.value);
                        }
            })
            .attr("fill",function(d){
                if(d.value==0){
                            return "#dddddd";
                } else {
                            return "#2196F3";
                }                     
            });

    svg.select("#avgline")
        .transition()
        .attr("x1", 0)
        .attr("y1", y(avg))
        .attr("x2", width)
        .attr("y2", y(avg))
        .attr("stroke-width", 2)
        .attr("stroke", "#EF5350");

    svg.select("#averagelabel1")
            .transition()    
            .attr("x", width+2)
            .attr("y", y(avg));
    
    svg.select("#averagelabel2")
            .transition()
            .attr("x", width+2)
            .attr("y", y(avg)+16);
}

function keyToYear(key){
    key=key-1;
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    years = ["13","14"];
    return months[key%12]+" "+years[parseInt(key/12)];
}

function generateMap(){
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = $('#map').width() - margin.left - margin.right,
    height = 375;
   
    var projection = d3.geo.mercator()
        .center([8,11])
        .scale(1200);

    var svg = d3.select('#map').append("svg")
        .attr("width", width)
        .attr("height", height);

    var path = d3.geo.path()
        .projection(projection);

    var g = svg.append("g");    

    g.selectAll("path")
        .data(regions.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke",'#000000')
        .attr("fill",'#cccccc')
        .attr("opacity",1)
        .attr("id",function(d){
            return "WFP"+d.properties.WFPCODE;
        })
        .attr("class","region");
  
    
    var g = svg.append("g"); 
}

function transitionCountryMap(country){
    var mapsettings = {"Guinea":{"scale":3000,"centre":[-5.8,8.5]},
            "Liberia":{"scale":4500,"centre":[-5.6,5.7]},
            "Mali":{"scale":1200,"centre":[9,15]},
            "Sierra Leone":{"scale":6000,"centre":[-9,8]}
        };
    
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
        width = $('#map').width() - margin.left - margin.right,
        height = 425;

        var projection = d3.geo.mercator()
            .center(mapsettings[country].centre)
            .scale(mapsettings[country].scale);
    
    var path = d3.geo.path()
        .projection(projection);
    d3.select("#map").selectAll("path")
        .attr("d", path)
        .attr("fill",'#cccccc')
        .attr("opacity",function(d){
            if(d.properties.CNTRY_NAME==country){
                return 1;
            } else {
                return 0;
            }
        })
        .attr("class","region")
        .attr("stroke","#000000");
}

function colorMap(data){
    
    d3.selectAll(".region").attr("fill","#cccccc");
    data.forEach(function(e){
      color = "#cccccc";
      if(e.value==0){
          color="#cccccc";
      } else if(e.value<0.8){
          color=mapColors[5];
      }  else if(e.value<0.9){
          color=mapColors[4];
      }  else if(e.value<1){
          color=mapColors[3];
      }  else if(e.value<1.1){
          color=mapColors[2];
      }  else if(e.value<1.2){
          color=mapColors[1];
      }  else {
          color=mapColors[0];
      }
      d3.select("#WFP"+e.key).attr("fill",color);
    });
}

function renderMarketChart(data,bar){
    if(data.length==0){
        $("#marketdata").html("<h3>No Data this month</h3>");
    } else {
        $("#marketdata").html("<h3>"+currentProduct+" per "+ units[currentCountry][currentProduct]+" prices for "+keyToYear(bar)+"</h3>");
    }
    data.sort(function(a, b) {
                return d3.descending(a.mp_price, b.mp_price);
        });
    data.forEach(function(e,i){
        e.uniqueid="id"+i;
        e.percent=e.mp_price/currentAverage;
    });

    var margin = {top: 80, right: 30, bottom: 30, left: 55},
        width = $("#marketdata").width() - margin.left - margin.right,
        height =  (data.length)*22;

    var y = d3.scale.ordinal()
            .rangeRoundBands([0, height], .1);

    var x = d3.scale.linear()
        .range([0,width]);    
    
    y.domain(data.map(function(d) {return d.uniqueid; }));
    x.domain([0,d3.max(data,function(d){return d.mp_price})]);
    d3.select("#marketdata").selectAll("svg").remove();
    var svg = d3.select("#marketdata").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
    svg.selectAll("bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "sparkbar")
            .attr("x", 0)
            .attr("width", function(d){ return x(d.mp_price);})
            .attr("y", function(d){;return y(d.uniqueid);})
            .attr("height", 19)
            .attr("fill",function(d){
                if(d.percent==0){
                    color="#cccccc";
                } else if(d.percent<0.8){
                    color=mapColors[5];
                }  else if(d.percent<0.9){
                    color=mapColors[4];
                }  else if(d.percent<1){
                    color=mapColors[3];
                }  else if(d.percent<1.1){
                    color=mapColors[2];
                }  else if(d.percent<1.2){
                    color=mapColors[1];
                }  else {
                    color=mapColors[0];
                }
                return color;
            });
            
    svg.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "sparkbar")
            .attr("x", 10)
            .attr("y", function(d){return y(d.uniqueid)+14;})
            .text(function(d){return d.mkt_name +", "+d.adm1_name +" ("+d.mp_price+")";});

    svg.append("text")
            .attr("class", "legend")
            .attr("x", 10)
            .attr("y", -60)
            .text("Price difference from 2013 country average");
    
        svg.append("rect")
            .attr("x", 0)
            .attr("y", -45)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill",mapColors[0]);

        svg.append("text")
            .attr("x",15)
            .attr("y",-37)
            .text("20% or more")
            .attr("font-size","10px");
    
        svg.append("rect")
            .attr("x", 80)
            .attr("y", -45)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill",mapColors[1]);

        svg.append("text")
            .attr("x",95)
            .attr("y",-37)
            .text("10% to 20%")
            .attr("font-size","10px");

        svg.append("rect")
            .attr("x", 160)
            .attr("y", -45)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill",mapColors[2]);

        svg.append("text")
            .attr("x",175)
            .attr("y",-37)
            .text("0% to 10%")
            .attr("font-size","10px");    

        svg.append("rect")
            .attr("x", 0)
            .attr("y", -25)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill",mapColors[3]);

        svg.append("text")
            .attr("x",15)
            .attr("y",-17)
            .text("-10% to 0%")
            .attr("font-size","10px");
    
        svg.append("rect")
            .attr("x", 80)
            .attr("y", -25)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill",mapColors[4]);

        svg.append("text")
            .attr("x",95)
            .attr("y",-17)
            .text("-20% to -10%")
            .attr("font-size","10px");

        svg.append("rect")
            .attr("x", 160)
            .attr("y", -25)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill",mapColors[5]);

        svg.append("text")
            .attr("x",175)
            .attr("y",-17)
            .text("-20% or less")
            .attr("font-size","10px");
    
        svg.append("rect")
            .attr("x", 240)
            .attr("y", -25)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill","#cccccc");

        svg.append("text")
            .attr("x",255)
            .attr("y",-17)
            .text("No data")
            .attr("font-size","10px");        
}

function resetMarketData(){
    d3.selectAll(".region").attr("fill","#cccccc");
    $("#marketdata").html("<h3>Mouse over bar on the above chart to get a monthly breakdown</h3>");
}

function changeTitle(){
    currencies = {"Guinea":"Guinean francs","Liberia":"Liberian dollars","Mali":"West African CFA francs","Sierra Leone":"Sierra Leonean leones"};
    title = currentProduct +" prices (per "+units[currentCountry][currentProduct]+") in "+currencies[currentCountry]+" from January 2013 to October 2014 for " +currentCountry;
    $("#productTitle").html(title);
}

products.forEach(function(e){
    $('#country_select').append('<option value="'+e.country+'">'+e.country+'</option>');
});

$('#country_select').change(function(){
    onCountrySelect($(this).val());
});


currentCountry = "Guinea";
currentProduct = "Beans";
generateBarChart(filterChartData("Guinea","Beans"));
generateMap();

onCountrySelect("Guinea");