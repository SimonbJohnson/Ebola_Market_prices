data.forEach(function(e){
    e.date = (e.mp_year-2013)*12+e.mp_month;
});

var cf = crossfilter(data);

var byCountry = cf.dimension(function(d){return d.adm0_name;});
var byProduct = cf.dimension(function(d){return d.cm_name;});
var byDate = cf.dimension(function(d){return d.date;});

var groupByDateCount = byDate.group();
var groupByDateSum = byDate.group().reduceSum(function(d) {return d.mp_price;});

var currentProduct;
var currentCountry;

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

function onCountrySelect(country){
    var html ="";
    var i = 0;
    $('#spark_charts').html(html);
    transitionCountryMap(country);
    products.forEach(function(e){
        if(e.country==country){
            e.products.forEach(function(e){
                $('#spark_charts').append('<p>'+e+'</p><div id="'+e.replace(/\s+/g, '')+'" class="sparkchart"></div>');
                generateSparkBars(e,filterChartData(country,e));
                if(i==0){
                    currentCountry = country;
                    currentProduct = e;
                    transitionBarChart(filterChartData(country,e));
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
                transitionBarChart(filterChartData($('#country_select').val(),product));              
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
                            return "red";
                } else {
                            return "green";
                }                     
            });
}

function generateBarChart(data){
    var margin = {top: 10, right: 30, bottom: 30, left: 70},
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
                            return "steelblue";
                }                     
            })
            .on("mouseover",function(d,i){
                data = filterBarData(i+1);
                var html = "";
                data.forEach(function(e){
                   html = html + "<p>"+ e.adm1_name+": "+e.mp_price+"</p>" ;
                });
                $('#marketdata').html(html);
            });            
            
    svg.append("line")
        .attr("x1", 0)
        .attr("y1", y(avg))
        .attr("x2", width)
        .attr("y2", y(avg))
        .attr("stroke-width", 2)
        .attr("stroke", "red")
        .attr("id","avgline");
}

function transitionBarChart(data){
    var margin = {top: 10, right: 30, bottom: 30, left: 70},
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
                            return "steelblue";
                }                     
            });

    svg.select("#avgline")
        .transition()
        .attr("x1", 0)
        .attr("y1", y(avg))
        .attr("x2", width)
        .attr("y2", y(avg))
        .attr("stroke-width", 2)
        .attr("stroke", "red");    
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
    height = 425;
   
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
        .attr("stroke",'#cccccc')
        .attr("fill",'#ffffff')
        .attr("opacity",1)
        .attr("id",function(d){
            return d.properties.PCODE_REF;
        })
        .attr("class","region");
  
    
    var g = svg.append("g"); 
}

function transitionCountryMap(country){
    var mapsettings = {"Guinea":{"scale":3200,"centre":[-6.5,8.3]},
            "Liberia":{"scale":3200,"centre":[-6,5]},
            "Mali":{"scale":1500,"centre":[5,9]},
            "Sierra Leone":{"scale":6000,"centre":[-9,7.7]}
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
        .attr("stroke",'#cccccc')
        .attr("fill",'#ffffff')
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