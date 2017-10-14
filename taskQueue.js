const EventEmitter = require('events').EventEmitter;

class TaskQueue {
    constructor(concurrency = 2) {
        this.concurrency = concurrency;
        this.queue = [];
        this.running = 0;
        this.eventEmitter = new EventEmitter();
        this.taskCount = 0;
    }

    push(task) {
        this.queue.push(task);
        this._next();
        return this;
    }

    _next() {
        if (this.queue.length === 0) {
            this.eventEmitter.emit('completed');
        }
        while (this.running < this.concurrency && this.queue.length) {
            const task = this.queue.shift();
            // console.log(`[*]\tTask ${this.taskCount++} started`);
            task(err => {
                if (err) {
                    this.eventEmitter.emit('error', err);
                }
                console.log(`[*]\tTask ${this.taskCount++} completed`);
                this.running--;
                this._next();
            });
            this.running++;
        }
    }

    onError(callback) {
        this.eventEmitter.addListener('error', callback);
        return this;
    }

    onComplete(callback) {
        this.eventEmitter.addListener('completed', callback);
        return this;
    }
}

module.exports = TaskQueue;