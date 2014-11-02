dataStream = new Meteor.Stream('data');

sendData = function(data) {//to be called when we want to send data
    dataStream.emit('message', data);
    console.log("Sent data to computer");
};


dataStream.on('message', function(data) {
    //console.log(data);
    if(typeof data == "object"){//we got a json
        //console.log(data);
        sendData("OK");//send a message to the phone telling it the computer got the data correctly
        receiveData(data);
        
    }
    else{//confirmation - received on mobile end
        if(data == "OK")//shit didn't go down
            console.log("Computer successfully received",data);
    }
    
});


var ave = function(list, b) {
    var min = 10000;
    var max = 0;

    for (var i=0; i<list.length; i++) {
        
            if (b == 'x') {
                if (list[i].firstPoint.x > max){
                    max = list[i].firstPoint.x;
                }
                if (list[i].firstPoint.x < min){
                    min = list[i].firstPoint.x;
                }
                if (list[i].lastPoint.x > max){
                    max = list[i].lastPoint.x;
                }
                if (list[i].lastPoint.x < min){
                    min = list[i].lastPoint.x;
                }
            }
            else{
                if (list[i].firstPoint.y > max){
                    max = list[i].firstPoint.y;
                }
                if (list[i].firstPoint.y < min){
                    min = list[i].firstPoint.y;
                }
                if (list[i].lastPoint.y > max){
                    max = list[i].lastPoint.y;
                }
                if (list[i].lastPoint.y < min){
                    min = list[i].lastPoint.y;
                }
            }
    }
    return (max + min)/2;
};
/** This function creates the JSON object, sends it and retrieves the result. */
recognize = function(strokes, apiKey, url) {
    if (!url) url = "https://myscript-webservices.visionobjects.com/api/myscript/v2.0/analyzer/doSimpleRecognition.json";

    var jsonPost = {
        "parameter": {
            "hwrParameter": {
                /** Language is a mandatory parameter. */
                "language": "en_US"
            }
        },
        "components": strokes
    };

    /** Send data to POST. Give your API key as supplied on registration, or the 
     * server will not recognize you as a valid user. */
     console.log(apiKey);
    var data = {
        "apiKey": apiKey,
        "analyzerInput": JSON.stringify(jsonPost)
    };

    /** Display the "wait" symbol while processing is underway. */
    $("#loading").show();
    $("#result").empty();
    /** Post request.  Careful! If there are no candidates, the sample may crash. */
    $.post(
        url,
        data,
        function(jsonResult) {
            $("#loading").hide();
            console.log(jsonResult.result);

            text = jsonResult.result.textLines;
            shapes = jsonResult.result.shapes;
            groups = jsonResult.result.groups;
            var obj = [];
            //analyze results here
            if(text.length>0){
                for (var i = 0; i < text.length; i++) {
                    var textext = text[i].result.textSegmentResult.candidates[0].label.replace(" ","");
                    textext = textext.replace("-","");
                    obj[text[i].uniqueID] = 
                        {
                            value: textext, 
                            x: text[i].data.topLeftPoint.x + text[i].data.width/2.0, 
                            y: text[i].data.topLeftPoint.y + text[i].data.height/2.0,
                            type: 'text'
                        }
                }
            }

            if(shapes.length>0){
                for (var i = 0; i < shapes.length; i++) {
                    var name = shapes[i].candidates[0].label;
                    if(name.indexOf('triangle') != -1)
                    {
                        name = 'Triangle';
                    }
                    if(name.indexOf('quadrilateral'))
                    {
                        name = 'Quad';
                    }
                    obj[shapes[i].uniqueID] =
                    {
                        value: name,
                        x: ave(shapes[i].candidates[0].primitives, 'x'),
                        y: ave(shapes[i].candidates[0].primitives, 'y'),
                        type: 'shape'
                    };
                }
            }

            if(groups.length>0){
                for (var i = 0; i< groups.length; i++)
                {
                    if(groups[i].type == 'LIST'){
                        var elements = groups[i].elementReferences
                        var son = {
                            list: [],
                            type: 'list'
                        };
                        for(var j=0; j< elements.length; j++)
                        {

                            son.list.push(obj[groups[i].elementReferences[j].uniqueID]);
                            obj[groups[i].elementReferences[j].uniqueID] = null;
                        }
                        obj.push(son)
                    }else{
                        obj[groups[i].elementReferences[1].uniqueID].child = obj[groups[i].elementReferences[0].uniqueID];
                        obj[groups[i].elementReferences[0].uniqueID] = null;
                    }
                }
            }
            obj = obj.filter(function(e){
                return e!=null;//removes null values
            })
            console.log(obj);

            sendData(obj);
        },
        "json"
    ).error(function(XMLHttpRequest, textStatus) {
        $("#loading").hide();
        $("#result").text(textStatus + " : " + XMLHttpRequest.responseText);
    });
};
function button(){
    methods.analyze();
}
Template.pyDraw.events({
    'click #analyzeButton' : function(){
        button();
    },
    'touchend #analyzeButton' : function(){
        button();
    }
});
/** Draw strokes in the canvas, as specified in the accompanying HTML file. */
$.fn.write = function(apiKey, url) {
    var stroke;
    var strokes = [];

    var canvas = this.get(0);
    var ctx = canvas.getContext("2d");

    canvas.width = this.first().width();
    canvas.height = this.first().height();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ecf0f1";
    ctx.strokeStyle = "#ecf0f1";

    var drawing = false;
    var lastX, lastY;

    methods = {
        start: function(x, y) {
            stroke = {
                "type": "stroke",
                "x": [x],
                "y": [y]
            };
            lastX = x;
            lastY = y;
            drawing = true;
        },
        move: function(x, y) {
            if (drawing) {
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();
                stroke.x.push(x);
                stroke.y.push(y);
                lastX = x;
                lastY = y;
            }
        },
        /*As soon as drawing finishes, the strokes are sent for recognition. */
        end: function() {
            if (drawing) {
                drawing = false;
                strokes.push(stroke);
            }
        },


        analyze: function() {
            recognize(strokes, apiKey, url);
        }
    };

   $(canvas).on("touchstart", function(event) {
      event.preventDefault();
      var offset = $(this).first().offset();
      var touch = event.originalEvent.touches[0];
      var x = touch.pageX - offset.left;
      var y = touch.pageY - offset.top;
      methods.start(x, y);
   });

   $(canvas).on("touchmove", function(event) {
      event.preventDefault();
      var offset = $(this).first().offset();
      var touch = event.originalEvent.touches[0];
      var x = touch.pageX - offset.left;
      var y = touch.pageY - offset.top;
      methods.move(x, y);
   });

   $("*").on("touchend", function(event) {
      event.preventDefault();
      methods.end();
   });

   $(canvas).on("mousedown", function(event) {
      event.preventDefault();
      var offset = $(this).first().offset();
      var x = event.pageX - offset.left;
      var y = event.pageY - offset.top;
      methods.start(x, y);
   });

   $(canvas).on("mousemove", function(event) {
      event.preventDefault();
      var offset = $(this).first().offset();
      var x = event.pageX - offset.left;
      var y = event.pageY - offset.top;
      methods.move(x, y);
   });

   $("*").on("mouseup", function(event) {
      event.preventDefault();
      methods.end();
   });
};

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
};

UI.registerHelper("isMobile", function(){
    var index = navigator.appVersion.indexOf("Mobile");
    return (index > -1);
})


function receiveData(data) {
    var stk = new Array();
    var classes = {};

    document.getElementById("yourcode").value = ""
    console.log(data);

    for(var i=0; i<data.length; i++)
    {
        if(data[i].type == "shape")
        {
            stk.push
            (
                {
                    shape: data[i].value,
                    child: data[i].child
                }
            )
            console.log("um");
                //$("#recFail").show();

            //document.getElementById("yourcode").setContent = data[i].child.value + "= "
        }
        else if(data[i].type == 'list')
        {
            var a = stk.pop()
            var list = data[i].list
            if(a.child == undefined)
            {
                var str = 'class ' + a.shape + ":\n";
                str += '    def __init__(self'
                for(var j=0; j<list.length; j++)
                {
                    str += ', '+list[j].value+j.toString();
                }
                str += '):\n';
                for(var j=0; j<list.length; j++)
                {
                    str += '        self.'+list[j].value+" = "+list[j].value+j.toString()+"\n";
                }
                document.getElementById("yourcode").value += str;
                console.log("hello");
            }
            else
            {
                var str = a.child.value +" = " + a.shape+"(";
                for(var j=0; j<list.length; j++)
                {
                    //if(list[j].value.indexOf('=')!=-1)
                    str += list[j].value.substring(list[j].value.indexOf('=')+1, list[j].value.length)+", ";
                }
                str = str.substring(0,str.length-2) + ")\n"
                document.getElementById("yourcode").value += str;
            }

        }
        else if(data[i].type == 'text')
        {
            //if(data[i].value.charAt(0)=='→')
                document.getElementById("yourcode").value += data[i].value.substring(1);
        }
    }
}