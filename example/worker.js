/*
* This is an example of using the Worker class in the Queuefy context.
* */

var queuefy = require('./../index.js');

var workerObj = new queuefy.Worker({
	host: '127.0.0.1',
	port: 5987
});

workerObj.connect(function() {
	console.log("Connected to " + this.config.host + ":" + this.config.port);
	this.enqueue({
		title: 'Hello',
		body: 'World',
		for: 'processing'
	}).enqueue("Another thing to enqueue")
		.enqueue(12345)
		.enqueue(true)
		.enqueue({
			"with": "confirmation"
		}, function(err) {
			if(err) {
				console.log('Could not enqueue, something went wrong', e);
			}
		});

	/* Dequeueing from the server. */
	console.log('Dequeueing in 1 sec...');
	setTimeout(function() {
		// Dequeue the last item in the queue.
		workerObj.dequeue(function(err, item) {
			if(err) return console.log("Could not dequeue.", err);
			// Dequeue the last 3 items in the list.
			workerObj.dequeue(3, function(err, list) {
				if(err) return console.log("Could not dequeue.", err);
				console.log("Should have gotten 3 items. Result: " + list.length);
				console.log(list);
				workerObj.size(function(err, count) {
					if(err) return console.log("Could not get size.", err);
					console.log('Current queue size: ' , count);
				});
			});
		});
	}, 1000);
}).on('error', function(e) {
	console.log("Whoops, got an error: ", e);
});