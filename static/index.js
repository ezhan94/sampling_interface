//$("#loginModal").modal({backdrop: 'static', keyboard: false});

//Define the three sizes of court for displaying on different panel
var w = 1000, h = 549
var w_med = 900, h_med = 494
var w_small = 750, h_small = 412
var scale=12*(w/(94*12+39*2))
var offsetX=39*(w/(94*12+39*2))
var offsetY=31*(w/(94*12+39*2))

var scale_med=12*(w_med/(94*12+39))
var offsetX_med=39*(w_med/(94*12+39))
var offsetY_med=31*(w_med/(94*12+39))

var scale_small=12*(w_small/(94*12+39))
var offsetX_small=39*(w_small/(94*12+39))
var offsetY_small=31*(w_small/(94*12+39))
var click_indicator = -1
var timestep=0
var simulated_traj=[]
var sampled_macro=[]
var tid=[]
var startLoc=[];
var macroGoal=[];
var visual_rect = [];
var interface_state=0; // 0: idle state, 1: input start location state, 2: input macro goals state, 3: play state,
                        //4: post-play state
//Define the d3 chart in main panel
var svg = d3.select("#chart").append("svg")
    .attr("width", w)
    .attr("height", h)
    .on('click', clicked)
    .on('mousemove', mousemove);
//Add the background image in main panel
var img = svg.append("image").attr("xlink:href", "/static/court2.jpg").attr("width", w).attr("height", h)


bootstrap_alert = function() {}
bootstrap_alert.warning = function(message) {
            $('#alert_placeholder').html('<div class="alert alert-warning" style="font-size:30px"><a class="close" data-dismiss="alert" >×</a><span>'+message+'</span></div>')
        }
bootstrap_alert.error = function(message) {
            $('#alert_placeholder').html('<div class="alert alert-danger" style="font-size:30px"><a class="close" data-dismiss="alert" >×</a><span>'+message+'</span></div>')
        }

bootstrap_alert.clear = function() {
            $('#alert_placeholder').html('')
        }


//Mouse down event used for drawing or manipulation

var colorList = ['#283593','red','#F57F17','#00695C','#9C27B0']
function clicked() {
    m1 = d3.mouse(this);
    if (click_indicator != -1){
        if (interface_state == 1){
            var x = (m1[0]-offsetX)/scale;
            var y = (m1[1]-offsetY)/scale
            if (x<0 || x>=50 || y<0 || y>=50) return;
            startLoc.push(x)
            startLoc.push(y)
            var line = svg.append('circle')
            .attr("cx", m1[0])
            .attr("cy", m1[1])
            .attr("r", 20)
            .attr("fill", colorList[click_indicator])
            .attr("stroke-width", 4)
            .attr("stroke", "white");

            var text = svg.append('text')
            .attr("x", m1[0])
            .attr("y", m1[1]+10)
            .text((click_indicator+1).toString())
            .attr("font-size", "30px")
            .attr("fill", 'white')
            .attr('text-anchor',"middle");
        }else if (interface_state == 2){
            var x = (m1[0]-offsetX)/scale;
            var y = (m1[1]-offsetY)/scale
            if (x<0 || x>=50 || y<0 || y>=50) return;
            visual_rect.attr('opacity',0.6);
            visual_rect=[]
            var col = Math.floor(x/5.0);
            var row = Math.floor(y/5.0);
            var bin_index = col*10+row;
            macroGoal.push(bin_index);
        }
        click_indicator += 1;
        if (click_indicator == 5) {
            click_indicator=-1;
            interface_state = 0
            $('#clickMacro').removeAttr('disabled');
            $('#clickStart').removeAttr('disabled');
            $('#caption').html('<br>')
        }
    }

}

//Mouse move event
function mousemove() {
    if (interface_state == 2){
        var m2 = d3.mouse(this);
        var x = (m2[0]-offsetX)/scale;
        var y = (m2[1]-offsetY)/scale;
        if (x<0 || x>=50 || y<0 || y>=50) return;
        var col = Math.floor(x/5.0);
        var row = Math.floor(y/5.0);
        x = col*5*scale + offsetX;
        y = row*5*scale + offsetY;
        if (visual_rect.length == 0){
             visual_rect = svg.append('rect')
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", 5*scale)
                        .attr("height", 5*scale)
                        .attr("fill", '#546E7A')
                        .attr("opacity", 0.4);
        }else{
            visual_rect.attr('x', x);
            visual_rect.attr('y', y);
        }
    }
}


//callback of popup window for user info record
$(function() {
    $("#loginButton").click(function() {
        if ($('#userName').val()==''){
            bootstrap_alert.warning('Please input your name');
        }else{
           $.ajax({
            type: "GET",
            url: $SCRIPT_ROOT + "/authorize/",
            contentType: "application/json; charset=utf-8",
            data:{userName: $('#userName').val()},
            success: function(data) {
                $("#loginModal").modal('hide')
            }
          })
        }
    })
})


//callback for simulate button
$(function() {
    $("#simButton").click(function() {
        if(startLoc.length!=10){
            $('#caption').text('Start locations are invalid');
            return -1;
        }
        var $btn = $(this).button('loading')
        $('#replayButton').attr('disabled','disabled');
        $('#caption').html('<br>')
        $.ajax({
            type: "GET",
            url: $SCRIPT_ROOT + "/sample/",
            contentType: "application/json; charset=utf-8",
            data:{startLoc: JSON.stringify(startLoc),macroGoal: JSON.stringify(macroGoal)},
            success: function(data) {
                simulated_traj = data['traj'];
                sampled_macro = data['macro'];
                tid=setInterval(updateFrame, 142);
                $btn.button('reset')
                $("#replayButton").removeAttr('disabled')
                interface_state = 3
                }
            })
    })
})

//callback for the macro goal toggle button
$(function(){
    $("#macroToggle").change(function(){
        if($(this).prop("checked") == true && interface_state == 4){
            timestep=simulated_traj.length-1
            plotMacroGoal()
            timestep=0
        }
        if($(this).prop("checked") == false && interface_state == 4){
            timestep = simulated_traj.length-1
            updateFrame()
        }
    })
})

//callback for replay button
$(function() {
    $("#replayButton").click(function() {
        if (timestep>0){
            timestep=0;
            clearInterval(tid)
        }
        tid=setInterval(updateFrame, 142);
        interface_state = 3
    })
})

function updateFrame(){
    //clear svg on the main viewer
    d3.select("#chart").select("svg").selectAll("circle").remove();
    d3.select("#chart").select("svg").selectAll("text").remove();
    d3.select("#chart").select("svg").selectAll("path").remove();
    d3.select("#chart").select("svg").selectAll("rect").remove();
    if ($('#macroToggle').prop('checked')==true)
        plotMacroGoal();
    plotTraj();
    plotPlayerPos()
    timestep += 1;
    if (timestep == simulated_traj.length){
        timestep = 0
        clearInterval(tid)
        interface_state = 4
    }

}

//Plot the trajectory on the main court
function plotTraj(){
    var lineData={Player:[]}
    var N_player = simulated_traj[0].length/2
    //feed the location data of each trajectory
    for (var jj=0; jj< timestep;++jj){
        for (var ii=0; ii<N_player;++ii){
            if (jj==0) lineData.Player.push([])
            lineData.Player[ii].push({"x":simulated_traj[jj][ii*2]*scale+offsetX, "y": simulated_traj[jj][ii*2+1]*scale+offsetY})
        }
    }

    //add line component to the svg
    var lineFunction = d3.svg.line().x(function(d){return d.x;})
                                    .y(function(d){return d.y;})
                                     .interpolate("linear");

    for (ii=0;ii<lineData.Player.length;++ii){
        if (lineData.Player[ii].length==0){
            continue
        }
        svg.append("path")
            .attr("d",lineFunction(lineData.Player[ii]))
            .attr("stroke", colorList[ii])
            .attr("stroke-width", 4)
            .attr("fill", "None");
    }
}


//Plot the current location of each player.
function plotPlayerPos() {

    var a = [{ "cx": simulated_traj[timestep][0]*scale+offsetX, "cy": simulated_traj[timestep][1]*scale+offsetY, "ID": '1',"radius": 20, "color": colorList[0], "stroke-width":4, "stroke":"white","key": 1},
               { "cx": simulated_traj[timestep][2]*scale+offsetX, "cy": simulated_traj[timestep][3]*scale+offsetY, "ID": '2', "radius": 20, "color": colorList[1],"stroke-width":4, "stroke":"white", "key": 2},
               { "cx": simulated_traj[timestep][4]*scale+offsetX, "cy": simulated_traj[timestep][5]*scale+offsetY, "ID": '3', "radius": 20, "color": colorList[2],"stroke-width":4, "stroke":"white", "key": 3},
               { "cx": simulated_traj[timestep][6]*scale+offsetX, "cy": simulated_traj[timestep][7]*scale+offsetY, "ID": '4', "radius": 20, "color": colorList[3],"stroke-width":4, "stroke":"white", "key": 4},
               { "cx": simulated_traj[timestep][8]*scale+offsetX, "cy": simulated_traj[timestep][9]*scale+offsetY, "ID": '5', "radius": 20, "color": colorList[4], "stroke-width":4, "stroke":"white","key": 5},];


    var p = svg.selectAll("circle")
        .data(a,key)
        .enter()
        .append("circle");

    var circleAttributes = p
        .attr("cx", function (d) { return d.cx; })
        .attr("cy", function (d) { return d.cy; })
        .attr("r", function (d) { return d.radius; })
        .style("fill", function (d) { return d.color; })
        .attr("stroke-width",function (d) {return d["stroke-width"]; })
        .attr("stroke",function (d) {return d.stroke; });

    var labels = svg.selectAll("text")
            .data(a)
            .enter()
            .append("text")


        var playerID = labels
            .attr("x", function(d) { return d.cx; })
            .attr("y", function(d) { return d.cy+10; })
            .text(function (d) { return d.ID; })
            .attr("font-size", "30px")
            .attr("fill", "white")
            .attr('text-anchor',"middle");


    function key(d) {
        if (d == undefined){
            return d;
        }else{
            return d.key
        }
    }
}

function plotMacroGoal() {
    for (var ii=0; ii<sampled_macro[timestep].length;++ii){
        var col = Math.floor(sampled_macro[timestep][ii]/10.0)
        var row = sampled_macro[timestep][ii]-10.0*col
        var x = col*5*scale+offsetX
        var y = row*5*scale+offsetY
        var rect = svg.append('rect')
        .attr("x", x)
        .attr("y", y)
        .attr("width", 5*scale)
        .attr("height", 5*scale)
        .attr("fill", colorList[ii])
        .attr("opacity", 0.5);

    }
}


//callback for start location button
$(function() {
    $("#clickStart").click(function() {
        d3.select("#chart").select("svg").selectAll("circle").remove();
        d3.select("#chart").select("svg").selectAll("text").remove();
        d3.select("#chart").select("svg").selectAll("path").remove();
        d3.select("#chart").select("svg").selectAll("rect").remove();
        d3.select("#chart").select("svg").selectAll("line").remove();
        click_indicator = 0;
        interface_state = 1
        startLoc=[]
        $('#caption').text('Click the start locations for 5 players on the left side.')
        $('#clickMacro').attr('disabled','disabled');
    })
})

//callback for macro goals button
$(function() {
    $("#clickMacro").click(function() {
        if ($("#clickMacro").text() == 'MacroGoals'){
            interface_state = 2;
            d3.select("#chart").select("svg").selectAll("circle").remove();
            d3.select("#chart").select("svg").selectAll("text").remove();
            d3.select("#chart").select("svg").selectAll("path").remove();
            d3.select("#chart").select("svg").selectAll("rect").remove();
            d3.select("#chart").select("svg").selectAll("line").remove();
            if (startLoc.length>0){
                for (var ii=0; ii<startLoc.length/2;++ii){
                    var line = svg.append('circle')
                    .attr("cx", startLoc[ii*2]*scale+offsetX)
                    .attr("cy", startLoc[ii*2+1]*scale+offsetY)
                    .attr("r", 20)
                    .attr("fill", colorList[ii])
                    .attr("stroke-width", 4)
                    .attr("stroke", "white");

                    var text = svg.append('text')
                    .attr("x", startLoc[ii*2]*scale+offsetX)
                    .attr("y", startLoc[ii*2+1]*scale+offsetY+10)
                    .text((ii+1).toString())
                    .attr("font-size", "30px")
                    .attr("fill", 'white')
                    .attr('text-anchor',"middle");
                }
            }

            $("#clickMacro").html('Remove<br>Macros')
            $('#caption').text('Click the macro goals for 5 players.')
            $('#clickStart').attr('disabled','disabled');
            $('#macroToggle').bootstrapToggle('on')
            click_indicator = 0;
        }else if ($("#clickMacro").text() == 'RemoveMacros'){
            if (interface_state == 4 || interface_state == 0 || interface_state == 2){
                d3.select("#chart").select("svg").selectAll("rect").remove();
                $('#macroToggle').bootstrapToggle('off')
            }

            macroGoal=[];
            interface_state = 0
            click_indicator=-1;
            $("#clickMacro").html('Macro<br>Goals');
            $('#caption').text('Macro goals removed!');
            $('#clickStart').removeAttr('disabled');
        }
//
    })

})

