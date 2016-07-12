"use strict";

class SimpleEventEmitter {
    constructor() {
        this._listeners = {};
    }

    on(event, listener) {
        var listeners = this._listeners[event];
        if (!listeners) {
            this._listeners[event] = listeners = [];
        }
        listeners.push(listener);
    }

    emit(event, arg1, arg2, arg3) {
        var listeners = this._listeners[event];
        if (!listeners) {
            return;
        }
        listeners.forEach(function (listener) {
            listener(arg1, arg2, arg3);
        });
    }
}

module.exports = SimpleEventEmitter;