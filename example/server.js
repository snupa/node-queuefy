var Queuefy = require('../index.js');

var serverObj = new Queuefy.Server({
	port: 5987
});

serverObj.listen(function() {
	console.log("Listening on " + this.config.host + ":" + this.config.port);
}).on('enqueue', function(item) {
	console.log("Somebody enqueued an item: ", item);
}).on('dequeue', function(items) {
	console.log("Somebody dequeued " + items.length + " items:");
	console.log(items);
});