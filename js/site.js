data.forEach(function(e){
    e.date = (e.mp_year-2013)*12+e.mp_month;
});

var cf = crossfilter(data);

var byCountry = cf.dimension(function(d){return d.adm0_name;});
var byProduct = cf.dimension(function(d){return d.cm_name;});
var byDate = cf.dimension(function(d){return d.date;});

var groupByDateCount = byDate.group();
var groupByDateSum = byDate.group().reduceSum(function(d) {return d.mp_price;});

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

function onCountrySelect(country){
    var html ="";
    $('#spark_charts').html(html);
    products.forEach(function(e){
        if(e.country==country){
            e.products.forEach(function(e){
                $('#spark_charts').append('<p>'+e+'</p><div id="'+e.replace(/\s+/g, '')+'" class="sparkchart"></div>');
                generateSparkBars(e,filterChartData(country,e));
            });
        }
    });
   
}

function generateSparkBars(product,data){
    //var height=$(id).height();
    //var width=$(id).width();;
    var id='#'+product.replace(/\s+/g, '');
    var height=50;
    var width=200;
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
            console.log(product);
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
            })
}

function generateBarChart(data){
    var margin = {top: 0, right: 30, bottom: 30, left: 30},
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
        if(e.value!=0){
            datadomain.push(e.value);
        }
    });
    
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([0,height]);    
    
    x.domain(data.map(function(d) {return d.key; }));
    var ydomain=d3.extent(datadomain,function(d){return d;});
    y.domain([0,ydomain[1]*1.1]);
    
    var svg = d3.select("#bar_chart").append("svg")
            .attr("width", width)
            .attr("height", height);

    svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", function(d,i) { return x.rangeBand()*i; })
            .attr("width", x.rangeBand()-1)
            .attr("y", function(d){
                        if(d.value==0){
                           return 0;
                        } else {
                           return height-y(d.value);
                        }                
            })
            .attr("height", function(d) {
                        if(d.value==0){
                           return height;
                        } else {
                            return y(d.value);
                        }
            })
            .attr("fill",function(d){
                if(d.value==0){
                            return "#dddddd";
                } else {
                            return "steelblue";
                }                     
            });
            
    svg.append("line")
        .attr("x1", 0)
        .attr("y1", height-y(avg))
        .attr("x2", width)
        .attr("y2", height-y(avg))
        .attr("stroke-width", 2)
        .attr("stroke", "red");
}

function transitionBarChart(data){
    var margin = {top: 0, right: 30, bottom: 30, left: 30},
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
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([0,height]);    
    
    x.domain(data.map(function(d) {return d.key; }));
    var ydomain=d3.extent(datadomain,function(d){return d;});
    y.domain([0,ydomain[1]*1.1]);
    
    var svg = d3.select("#bar_chart");

    svg.selectAll("rect")
            .data(data)
            .transition()
            .attr("x", function(d,i) { return x.rangeBand()*i; })
            .attr("width", x.rangeBand()-1)
            .attr("y", function(d){
                        if(d.value==0){
                           return 0;
                        } else {
                           return height-y(d.value);
                        }
                
            })
            .attr("height", function(d) {
                        if(d.value==0){
                           return height;
                        } else {
                            return y(d.value);
                        }
            })
            .attr("fill",function(d){
                if(d.value==0){
                            return "#dddddd";
                } else {
                            return "steelblue";
                }                     
            });

    svg.select("line")
        .transition()
        .attr("x1", 0)
        .attr("y1", height-y(avg))
        .attr("x2", width)
        .attr("y2", height-y(avg))
        .attr("stroke-width", 2)
        .attr("stroke", "red");    
}

products.forEach(function(e){
    $('#country_select').append('<option value="'+e.country+'">'+e.country+'</option>');
});

$('#country_select').change(function(){
    onCountrySelect($(this).val());
});

onCountrySelect("Guinea");
generateBarChart(filterChartData("Guinea","Beans"));