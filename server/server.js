dataStream = new Meteor.Stream('data');

Meteor.methods({
	'saveSnippet':function(codeSnippet, snippetName, userId){
		Snippets.insert({code:codeSnippet, name:snippetName, owner:userId})
	}
})