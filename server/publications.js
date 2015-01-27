Meteor.publish('userSnippets', function(userId){
	return Snippets.find({owner:userId})
})
Meteor.publish('specificSnippet', function(snippetName, userId){
	return Snippets.find({owner:userId, name:snippetName})
})