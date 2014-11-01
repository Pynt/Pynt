dataStream = new Meteor.Stream('data');

sendData = function(data) {
    dataStream.emit('message', data);
    alert("SENT DATA TO COMPUTARO")
};

dataStream.on('message', function(data) {
    console.log(data);
    if(typeof data == "object"){//we got a json
        alert("GOT DATA FROM PHONE");
        console.log(data);
        dataStream('message',"OK")
    }
    else{//confirmation - received on mobile end
        if(data == "OK")
            alert("COMPUTARO RECEIVED DATA")
    }
    
});


if (Meteor.isClient) {
    // counter starts at 0
    Session.setDefault("counter", 0);

    Template.hello.helpers({
        counter: function() {
            return Session.get("counter");
        }
    });

    Template.hello.events({
        'click button': function() {
            // increment the counter when button is clicked
            Session.set("counter", Session.get("counter") + 1);
        }
    });

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
                //analyze results here
                if(text.length>0){
                    for (var i = 0; i < text.length; i++) {
                        candidates = text[i].result.textSegmentResult.candidates
                        for (var i = 0; i < candidates.length; i++) {
                            console.log(candidates[i].label)
                        };
                    };
                }
                if(shapes.length>0){
                    for (var i = 0; i < shapes.length; i++) {
                        candidates = shapes[i].candidates
                        for (var i = 0; i < candidates.length; i++) {
                            console.log(candidates[i].label);
                        };
                    };
                }



                var str = JSON.stringify(jsonResult, undefined, 4);
                $("#result").html(syntaxHighlight(str));
            },
            "json"
        ).error(function(XMLHttpRequest, textStatus) {
            $("#loading").hide();
            $("#result").text(textStatus + " : " + XMLHttpRequest.responseText);
        });
    };

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
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";

        var drawing = false;
        var lastX, lastY;

        var methods = {
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

        /** Describes the writing events on the canvas, for mouse and touchscreen.   */


        $("#analyzeButton").click(
            function(event) {
                event.preventDefault();
                methods.analyze();
            }
        );


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


}
