node-queuefy
============

A simple, performant and straight-forward queue system for Node.js

### Installation

```bash
$ npm install node-queuefy
```


### Queue server

```js
var queuefy = require('node-queuefy');
var server = new queuefy.Server({
   port: 5678
});

server.on('enqueue', function(item){
   console.log("Enqueued item: ", item);
}).on('dequeue', function(item) {
   console.log("Dequeued item: ", item);
});
server.listen(function() {
   console.log('Listening on port ' + server.config.port);
});
```

## Worker example for queueing / dequeue
```js
var queuefy = require('node-queuefy');
var worker = new queuefy.Worker({
   host: '127.0.0.1',
   port: 5678
});
worker.connect(function(){
   console.log('Connected to the queue server');
   // Enqueue a string item for processing, with a confirmation callback
   worker.enqueue("item", function(err) {
      if(err) console.log(err);
   });
   // Enqueue an object with no confirmation callback, used for fast enqueueing
   worker.enqueue({
      'this': 'is',
      'an': 'item'
   });

   // Dequeue the last enqueued item.
   worker.dequeue(function(err, item) {
      if(err) return console.log(err);
      console.log('Dequeued for processing: ', item);
   });
   // Dequeue the last 5 items enqueued in the list
   worker.dequeue(5, function(err, items) {
      if(err) return console.log(err);
      console.log('Dequeued ' + items.length + ' items');
   });
});
worker.on('error', function(e) {
   console.log('Whoops, got an error: ', e);
});

```

### Benchmarking

I have set up the queue server on one 5$ DigitalOcean droplet, and 50 worker clients which managed to push 30.000 items/second, with no callback confirmation.
Tested with callback confirmations, the rate dropped at about 3.000 events/second
