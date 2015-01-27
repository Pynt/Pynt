Deps.autorun(function () {
  Meteor.subscribe('userSnippets', Meteor.userId());
});

window.onload = function(){
  codeMirror = CodeMirror(document.getElementById('cm'), {
    value: "",
    mode:  "python"
  });
}

//the console will log that Sk is not foudn, which is not a problem as the code still runs

function outf(text) { 
    var mypre = document.getElementById("output"); 
    mypre.innerHTML = mypre.innerHTML + text; 
} 
function builtinRead(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
            throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
}
 

function saveCode(){
  var currCode = codeMirror.getValue()
  var currName = $("#snippetName").val()
  if(currName)
  {
    Meteor.call('saveSnippet', currCode, currName, Meteor.userId())
    console.log("saving code")
  }
  else{
    console.log("please enter a name")
  }
}
function loadCode(){
  var currName = $("#snippetName").val()
  if(currName){
    var currSnippet = Snippets.findOne({name:currName})
    if(currSnippet){
      codeMirror.setValue(currSnippet.code)
    }
  }
}

// Here's everything you need to run a python program in skulpt
// grab the code from your textarea
// get a reference to your pre element for output
// configure the output function
// call Sk.importMainWithBody()
function runit() { 
   // var prog = document.getElementById("yourcode").value; 
   var prog = codeMirror.getValue();
   var mypre = document.getElementById("output"); 
   mypre.innerHTML = ''; 
   Sk.pre = "output";
   Sk.configure({output:outf, read:builtinRead}); 
   try {
      eval(Sk.importMainWithBody("<stdin>",false,prog)); 
   }
   catch(e) {
       mypre.textContent = e.toString();
   }
} 

Template.pythonInterpret.events({
    'click #runPython' : function(){
      runit();
    },
    'touchend #runPython' : function(){
      runit();
    },
    'click #saveCode' : function(){
      //saveCode() is in snippet.js
      saveCode()
    },
    'click #loadCode' : function(){
      loadCode()
    }
});