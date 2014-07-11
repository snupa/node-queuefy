
var events = require('events'),
	nssocket = require('nssocket'),
	util = require('util'),
	Queue = require('./queue.js');

/*
* The server class
* */

var server = function Server(_config) {
	if(typeof _config != 'object' || _config == null) _config = {};
	this.config = {
		host: typeof _config.host == 'string' ? _config.host : process.env.NODE_HOST || '127.0.0.1',
		port: typeof _config.port == 'number' ? _config.port : parseInt(process.env.NODE_PORT) || 18755
	};
	this.queue = new Queue();
	events.EventEmitter.apply(this, arguments);
};
util.inherits(server, events.EventEmitter);

/*
* Starts listening.
* */
server.prototype.listen = function Listen(callback) {
	var self = this;
	this.connection = nssocket.createServer(function(socket) {
		var onError = function OnError(e) {
			socket._connected = false;
			socket.destroy();
		};
		socket.on('error', onError);
		socket._connected = true;
		self.bindSocket(socket);
	});
	this.connection.on('error', function(e) {
		self.emit('error', e);
	});
	self.connection.listen(self.config.port, self.config.host, function() {
		if(typeof callback == 'function') callback.call(self);
	});
	return this;
};

/*
* Sends to a given socket, the event and callback, allong with optional data.
* */
server.prototype.send = function SendToSocket(socketObj, event, callback, data) {
	if(socketObj._connected == false) return false;
	if(typeof callback != 'string') return false;
	var payload = {
		cb: callback
	};
	if(typeof data != 'undefined') payload.data = data;
	socketObj.send([event], payload);
	return true;
};

/*
* Binds a socket and starts listening to events from it.
* */
server.prototype.bindSocket = function BindSocket(socketObj) {
	var self = this;
	socketObj.data(['enqueue'], function(data) {
		var payload = data.data,
			callback_id = data.cb;
		self.queue.enqueue(payload);
		self.send(socketObj, 'callback', callback_id);
		self.emit('enqueue', payload);
	});
	socketObj.data(['dequeue'], function(data) {
		var count = (typeof data.data != 'number' ? 1 : data.data),
			callback_id = data.cb;
		/* We first generate the array that we want to send, without actually removing the items from the queue */
		var items = self.queue.dequeue(count, false);
		/* Only if the socket is still active, and we manage to send the items, we remove them from the queue. */
		if(self.send(socketObj, 'callback', callback_id, items)) {
			self.queue.dequeue(count, true);
			self.emit('dequeue', items);
		}
	});
	socketObj.data(['size'], function(data) {
		var callback_id = data.cb,
			size = self.queue.size();
		self.send(socketObj, 'callback', callback_id, size);
	});
};

module.exports = server;