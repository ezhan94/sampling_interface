//$("#loginModal").modal({backdrop: 'static', keyboard: false});

//Define the three sizes of court for displaying on different panel
var w = 1000, half_w = 530, h = 549
var scale=12*(w/(94*12+39*2))
var offsetX=39*(w/(94*12+39*2))
var offsetY=31*(w/(94*12+39*2))

var burn_in=10
var click_indicator = -1
var timestep=0
var timestep0=burn_in-1
var simulated_traj0=[]
var simulated_traj=[]
var sampled_macro0=[]
var sampled_macro=[]
var tid=[];
var tid0=[];
var startLoc=[];
var macroGoal=[];
var visual_rect = [];
var interface_state0=0
var interface_state=0; // 0: idle state, 1: input start location state, 2: input macro goals state, 3: play state,
                        //4: post-play state

//Define the d3 chart2 in main panel
var svg0 = d3.select("#chart1").append("svg")
    .attr("width", half_w)
    .attr("height", h)
    .on('click', clicked);
//Add the background image in main panel
var img = svg0.append("image").attr("xlink:href", "/static/left_court.jpg").attr("width", half_w).attr("height", h)

//Define the d3 chart2 in main panel
var svg = d3.select("#chart2").append("svg")
    .attr("width", half_w)
    .attr("height", h)
    .on('click', clicked)
    .on('mousemove', mousemove);
//Add the background image in main panel
var img = svg.append("image").attr("xlink:href", "/static/left_court.jpg").attr("width", half_w).attr("height", h)


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
                        .attr("fill", colorList[click_indicator])
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
    $("#simButton0").click(function() {
        if($("#preset_select").val()==null){
            $('#caption0').text('Please select a preset first');
            return -1;
        }
        var $btn = $(this).button('loading')
        $('#replayButton0').attr('disabled','disabled');
        $('#caption0').html('<br>')
        $.ajax({
            type: "GET",
            url: $SCRIPT_ROOT + "/sample/",
            contentType: "application/json; charset=utf-8",
            data:{startLoc: JSON.stringify([]),macroGoal: JSON.stringify([]), preset_ID: $("#preset_select").val()},
            success: function(data) {
                simulated_traj0 = data['traj'];
                sampled_macro0 = data['macro'];
                tid0=setInterval(updateFrame0, 142);
                $btn.button('reset')
                $("#replayButton0").removeAttr('disabled')
                interface_state0 = 3
                }
            })
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
            data:{startLoc: JSON.stringify(startLoc),macroGoal: JSON.stringify(macroGoal),preset_ID: -1},
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

$(function(){
    $("#macroToggle0").change(function(){
        if($(this).prop("checked") == true && interface_state0 == 4){
            timestep0=simulated_traj0.length-1
            plotMacroGoal0()
            timestep0=burn_in-1
        }
        if($(this).prop("checked") == false && interface_state0 == 4){
            timestep0 = simulated_traj0.length-1
            updateFrame0()
        }
    })
})


$("#preset_select").change(function(){
    var selected_ID = $("#preset_select").val()
    $.ajax({
            type: "GET",
            url: $SCRIPT_ROOT + "/feed_preset/",
            contentType: "application/json; charset=utf-8",
            data:{preset_ID: selected_ID},
            success: function(data) {
                    if (interface_state0==3){
                        clearInterval(tid0)
                        timestep0 = burn_in-1
                    }
                    $('#caption0').html('<br>')
                    simulated_traj0 = data['preset'];
                    sampled_macro0 = [];
                    updateFrame0();
                    timestep0=burn_in-1
                    interface_state0 == 0
                }
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

//callback for replay0 button
$(function() {
    $("#replayButton0").click(function() {
        if (timestep0>0){
            timestep0=burn_in-1;
            clearInterval(tid0)
        }
        tid0=setInterval(updateFrame0, 142);
        interface_state0 = 3
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


function updateFrame0(){
    //clear svg on the main viewer
    d3.select("#chart1").select("svg").selectAll("circle").remove();
    d3.select("#chart1").select("svg").selectAll("text").remove();
    d3.select("#chart1").select("svg").selectAll("path").remove();
    d3.select("#chart1").select("svg").selectAll("rect").remove();
    if ($('#macroToggle0').prop('checked')==true && sampled_macro0.length>0)
        plotMacroGoal0();
    plotTraj0();
    plotPlayerPos0()
    timestep0 += 1;
    if (timestep0 == simulated_traj0.length){
        timestep0 = burn_in-1
        clearInterval(tid0)
        interface_state0 = 4
    }
}



function updateFrame(){
    //clear svg on the main viewer
    d3.select("#chart2").select("svg").selectAll("circle").remove();
    d3.select("#chart2").select("svg").selectAll("text").remove();
    d3.select("#chart2").select("svg").selectAll("path").remove();
    d3.select("#chart2").select("svg").selectAll("rect").remove();
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
function plotTraj0(){
    var lineData={Player:[]}
    var N_player = simulated_traj0[0].length/2
    //feed the location data of each trajectory
    for (var jj=0; jj<= timestep0;++jj){
        for (var ii=0; ii<N_player;++ii){
            if (jj==0) lineData.Player.push([])
            lineData.Player[ii].push({"x":simulated_traj0[jj][ii*2]*scale+offsetX, "y": simulated_traj0[jj][ii*2+1]*scale+offsetY})
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
        svg0.append("path")
            .attr("d",lineFunction(lineData.Player[ii].slice(0,burn_in)))
            .attr("stroke", colorList[ii])
            .attr("stroke-width", 5)
            .attr("fill", "None");

        svg0.append("path")
            .attr("d",lineFunction(lineData.Player[ii].slice(burn_in)))
            .attr("stroke", colorList[ii])
            .attr("stroke-width", 4)
            .style("stroke-dasharray",("3,3"))
            .attr("fill", "None");
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
function plotPlayerPos0() {

    var a = [{ "cx": simulated_traj0[timestep0][0]*scale+offsetX, "cy": simulated_traj0[timestep0][1]*scale+offsetY, "ID": '1',"radius": 20, "color": colorList[0], "stroke-width":4, "stroke":"white","key": 1},
               { "cx": simulated_traj0[timestep0][2]*scale+offsetX, "cy": simulated_traj0[timestep0][3]*scale+offsetY, "ID": '2', "radius": 20, "color": colorList[1],"stroke-width":4, "stroke":"white", "key": 2},
               { "cx": simulated_traj0[timestep0][4]*scale+offsetX, "cy": simulated_traj0[timestep0][5]*scale+offsetY, "ID": '3', "radius": 20, "color": colorList[2],"stroke-width":4, "stroke":"white", "key": 3},
               { "cx": simulated_traj0[timestep0][6]*scale+offsetX, "cy": simulated_traj0[timestep0][7]*scale+offsetY, "ID": '4', "radius": 20, "color": colorList[3],"stroke-width":4, "stroke":"white", "key": 4},
               { "cx": simulated_traj0[timestep0][8]*scale+offsetX, "cy": simulated_traj0[timestep0][9]*scale+offsetY, "ID": '5', "radius": 20, "color": colorList[4], "stroke-width":4, "stroke":"white","key": 5},];


    var p = svg0.selectAll("circle")
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

    var labels = svg0.selectAll("text")
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

function plotMacroGoal0() {
    for (var ii=0; ii<sampled_macro0[timestep0].length;++ii){
        var col = Math.floor(sampled_macro0[timestep0][ii]/10.0)
        var row = sampled_macro0[timestep0][ii]-10.0*col
        var x = col*5*scale+offsetX
        var y = row*5*scale+offsetY
        var rect = svg0.append('rect')
        .attr("x", x)
        .attr("y", y)
        .attr("width", 5*scale)
        .attr("height", 5*scale)
        .attr("fill", colorList[ii])
        .attr("opacity", 0.5);

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
        d3.select("#chart2").select("svg").selectAll("circle").remove();
        d3.select("#chart2").select("svg").selectAll("text").remove();
        d3.select("#chart2").select("svg").selectAll("path").remove();
        d3.select("#chart2").select("svg").selectAll("rect").remove();
        d3.select("#chart2").select("svg").selectAll("line").remove();
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
            d3.select("#chart2").select("svg").selectAll("circle").remove();
            d3.select("#chart2").select("svg").selectAll("text").remove();
            d3.select("#chart2").select("svg").selectAll("path").remove();
            d3.select("#chart2").select("svg").selectAll("rect").remove();
            d3.select("#chart2").select("svg").selectAll("line").remove();
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
                d3.select("#chart2").select("svg").selectAll("rect").remove();
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

