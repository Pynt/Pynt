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
Template.snippets.events({
    'click #saveCode' : function(){
      //saveCode() is in snippet.js
      saveCode()
    },
    'click #loadCode' : function(){
      loadCode()
    }
});