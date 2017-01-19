"use strict";

const SimpleEventEmitter = require('./SimpleEventEmitter');
const Channel = require('./Channel');
const ChannelError = require ('./ChannelError');
const wire = require("./WireProtocol.Protocol.js");
const pew = require("./PewRuntime");
const _ = require('lodash');

/**
 * ChannelData
 *
 * @fires add(key, value) When a new key/value is added.
 * @fires update(key, value) When a key's value is updated.
 * @fires remove(key) When a key and it's value is removed.
 * @fires 'key'(value, operation) When the specified key is added, updated or
 * removed this event will be fired. Operation will be one of add, update, or
 * remove.
 */
class ChannelData extends SimpleEventEmitter {
    constructor(client, keySpace, channel) {
        super();
        this.client = client;
        this.keySpace = keySpace;
        this.elementMap = {};
        this.channel = channel;
        this.onWireChannelDataCreate.bind(this);
        this.onWireChannelDataDelete.bind(this);
        this.onWireChannelDataUpdate.bind(this);
    }

    /**
     * Get the value for the specified key.
     * @param key
     * @returns {any}
     */
    get(key) {
        return this.elementMap[key];
    }

    /**
     * Set a value for the specified key.
     * @param key
     * @param value
     * @param callback
     */
    put(key, value, callback) {
        if (!this._isValidKey(key)) {
            if(callback) {
                callback(new ChannelError("ChannelData key must be a non-empty string."));
            }
            return;
        }
        else if (!this._isSaneValue(value)) {
            if(callback) {
                callback(new ChannelError("ChannelData value cannot be null."));
            }
            return;
        }
        if (this.channel.hasPermission("PutChannelData")) {
            var msg = new wire.WireChannelDataPut();
            msg.key = key;
            msg.ks = this.keySpace;
            msg.name = this.channel.getName();
            msg.payload = new pew.ByteArray(pew.base64_encode(JSON.stringify(value)));
            this.client.sendToServer(msg);
            if (callback) {
                callback(null);
            }
        }
        else {
            if (callback) {
                callback(new ChannelError("No permission to put on this channel."));
            }
        }
    }

    _isValidKey(key) {
        return _.isString(key) &&  !_.isEmpty(key);
    }

    _isSaneValue(value) {
        return _.isObject(value) || _.isArray(value) || _.isNumber(value) || _.isString(value);
    }


    /**
     * Remove the specified key and it's value.
     * @param key
     * @param callback
     */
    remove(key, callback) {
        if (!key) {
            if(callback) {
                callback(new ChannelError("ChannelData key cannot be null."));
            }
            return;
        }
        if (this.channel.hasPermission("DelChannelData")) {
            var del = new wire.WireChannelDataDel();
            del.key = key;
            del.ks = this.keySpace;
            del.name = this.channel.getName();
            this.client.sendToServer(del);
            if (callback) {
                callback(null);
            }
        }
        else {
            if (callback) {
                callback(new ChannelError("No permission to del on this channel."));
            }
        }
    }

    /**
     * Get a list of the keys on this ChannelData.
     * @returns {Array}
     */
    getKeys() {
        var keys = [];
        for (var k in this.elementMap) {
            keys.push(k);
        }
        return keys;
    }

    ////////////////////////////////////////////////////////////////////////////
    // End of public interface
    ////////////////////////////////////////////////////////////////////////////
    onWireChannelDataCreate(msg) {
        var payload = msg.payload.getBytesAsUTF8();
        var o = JSON.parse(payload);
        this.elementMap[msg.key] = o;
        this.emit('add', msg.key, o);
        this.emit(msg.key, o, 'add');
    }

    onWireChannelDataUpdate(msg) {
        var payload = msg.payload.getBytesAsUTF8();
        var o = JSON.parse(payload);
        this.elementMap[msg.key] = o;
        this.emit('update', msg.key, o);
        this.emit(msg.key, o, 'update');
    }

    onWireChannelDataDelete(msg) {
        delete this.elementMap[msg.key];
        this.emit('remove', msg.key);
        this.emit(msg.key, null, 'remove');
    }
}

module.exports = ChannelData;