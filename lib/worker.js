/**
 * Class File: worker
 * Created by Adrian on 11-Jul-14.
 */

var events = require('events'),
	nssocket = require('nssocket'),
	util = require('util');

var worker = function Worker(_config) {
	if(typeof _config != 'object' || _config == null) _config = {};
	this.config = {
		host: typeof _config.host == 'string' ? _config.host : process.env.NODE_HOST || '127.0.0.1',
		port: typeof _config.port == 'number' ? _config.port : parseInt(process.env.NODE_PORT) || 18755
	};
	this.connection = null;
	this._connected = false;
	events.EventEmitter.apply(this, arguments);
};
util.inherits(worker, events.EventEmitter);

worker.prototype.CALLBACKS = {};
worker.prototype.DATA_QUEUE = [];

/*
* Connects to the server.
* */
worker.prototype.connect = function Connect(callback) {
	var self = this;
	this.connection = new nssocket.NsSocket();
	this.connection.on('error', function(e) {
		self._connected = false;
		self.connection.destroy();
		// Any callbacks expecting result will be called with error
		for(var callback_id in self.CALLBACKS) {
			self.CALLBACKS[callback_id].call(self, e, null);
			delete self.CALLBACKS[callback_id];
		}
		self.emit('disconnect');
		setTimeout(function() {
			self.connect();
		}, 100);
	});
	this.connection.connect(this.config.port, this.config.host, function() {
		self._connected = true;
		Bind.call(self);
		// Flushing any events
		for(var i= self.DATA_QUEUE.length-1; i >= 0; i--) {
			Send.call(self, self.DATA_QUEUE[i].event, self.DATA_QUEUE[i].data, self.DATA_QUEUE[i].cb);
		}
		self.DATA_QUEUE = [];
		if(typeof callback == 'function') callback.call(self);
	});
	return this;
};

/*
* Enqueues the given data to the server.
* */
worker.prototype.enqueue = function Enqueue(data, callback) {
	Send.call(this, 'enqueue', data, callback);
	return this;
};

/*
* Asks the server the queue list size.
* */
worker.prototype.size = function Size(callback) {
	if(typeof callback != 'function') throw new Error('Size callback is required.');
	Send.call(this, 'size', null, callback);
	return this;
};

/*
* Dequeues the given number of items from the server.
* */
worker.prototype.dequeue = function Dequeue(_count, _callback) {
	var count = (typeof _count == 'number' ? _count : 1),
		callback = (typeof _count == 'function' ? _count : _callback);
	if(typeof callback != 'function') throw new Error("Dequeueing callback is required.");
	Send.call(this, 'dequeue', count, function(err, list) {
		if(err) return callback(err, null);
		if(!(list instanceof Array)) list = [list];
		for(var i=0; i < list.length; i++) {
			if(typeof list[i] == 'string') {
				try {
					list[i] = JSON.parse(list[i]);
				} catch(e) {}
			}
		}
		/* If the user wants to dequeue only a single item, we call back with that item. */
		if(count == 1) {
			if(list.length == 0) return callback(null, null);
			return callback(null, list[0]);
		}
		/* If not, we return the entire list. */
		callback(null, list);
	});
	return this;
};

/* PRIVATE FUNCTIONS */

/*
* Starts listening to events from the server.
* Currently, the only event we get from the server is a response to a previous request, called "callback"
* */
function Bind() {
	var self = this;
	this.connection.data(['callback'], function(data) {
		var callback_id = data.cb;
		if(typeof self.CALLBACKS[callback_id] == 'undefined') {
			return self.emit('error', new Error("Unregistered callback was returned by the server: " + callback_id));
		}
		var payload = null;
		if(typeof data.data != 'undefined') {
			try {
				payload = JSON.parse(data.data);
			} catch(e) {
				payload = data.data;
			}
		}
		self.CALLBACKS[callback_id].call(self, null, payload);
		delete self.CALLBACKS[callback_id];
	});
}

/*
* Sends the specified event and data to the server.
* Note: if the connection to the server is not working, it stacks up the events until
* it is back online. When the connection is back online, it flushes all the events.
* */
function Send(event, _data, callback) {
	var data = (typeof _data == 'object' && _data != null) ? JSON.stringify(_data) : _data,
		callback_id = null;
	if(typeof callback == 'function') {
		callback_id = uid();
		this.CALLBACKS[callback_id] = callback;
	}
	if(typeof callback == 'string') {
		callback_id = callback_id;
	}
	if(this._connected == false) {
		this.DATA_QUEUE.push({
			event: event,
			data: data,
			cb: callback_id
		});
		return false;
	}
	var payload = {
		data: data,
		cb: callback_id
	};
	this.connection.send(event, payload);
	return this;
}

/*
* Generates a 16-char unique id used for callbacks.
* */
function uid() {
	var _p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890",
		r = "",
		strLen = _p.length;
	for(var i=0; i< 16; i++) {
		r += _p.charAt(Math.floor(Math.random() * strLen));
	}
	return r;
}

module.exports = worker;