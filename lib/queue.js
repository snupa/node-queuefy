/**
 * Class File: queue
 * Created by Adrian on 11-Jul-14.
 */

var queue = function Queue() {
	this.list = [];
};

/*
* Returns the queue size.
* */
queue.prototype.size = function GetSize() {
	return this.list.length;
};

/*
* Enqueues the given data for further processing.
* */
queue.prototype.enqueue = function Enqueue(data) {
	this.list.push(data);
	return true;
};

/*
* Dequeues the givem number of items.
* */
queue.prototype.dequeue = function Dequeue(count, shouldRemove) {
	/* If we need to remove the given count elements from the queue, we do so */
	if(shouldRemove) {
		this.list.splice(this.list.length-count);
		return true;
	} else {
		/* If not, we just return the result array */
		return this.list.slice(this.list.length-count).reverse();
	}
};

module.exports = queue;