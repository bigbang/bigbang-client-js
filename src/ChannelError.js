"use strict";

class ChannelError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}


module.exports =ChannelError;