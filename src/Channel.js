"use strict";

const SimpleEventEmitter = require('./SimpleEventEmitter');
const ChannelData =require('./ChannelData');
const wire = require("./WireProtocol.Protocol.js");
const pew = require("./PewRuntime");


class ChannelMessage {

}

/**
 * Channel
 *
 * @fires message When a message is received on the channel.
 * @fires join When someone joins the channel.
 * @fires leave When someone has left the channel.
 * @fires addNamespace When a namespace is added to the channel.
 */
class Channel extends SimpleEventEmitter {
    constructor(client, name) {
        super();
        this.unsubscribeCallback = null;
        this.client = client;
        this.name = name;
        this.responses = {};
        this.keySpaces = {};
        this.channelPermissions = [];
        this.currentSubscribers = [];
        this.keySpaces["_meta"] = new ChannelData(client, "_meta", this);
        this.keySpaces["def"] = new ChannelData(client, "def", this);
        this.metaKeyspace().on("subs", (doc) => {
            var self = this;
            var oldSubs = this.currentSubscribers;
            this.currentSubscribers = this.getSubscribers();
            var diff = this.diff(oldSubs, this.getSubscribers());
            diff.forEach(function (id) {
                if (oldSubs.indexOf(id) != -1) {
                    self.emit('leave', id);
                }
                else {
                    self.emit('join', id);
                }
            });
        });
    }

    /**
     * Get the name of this Channel.
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * Get either the named ChannelData or the default if no namespace is
     * specified.
     * @param namespace
     * @returns {ChannelData}
     */
    getChannelData(namespace) {
        namespace = namespace || 'def';
        return this.getOrCreateChannelData(namespace);
    }

    /**
     * Get the clientIds of the current subscribers on this channel.
     * @returns {Array<string>}
     */
    getSubscribers() {
        var subs = [];
        var doc = this.metaKeyspace().get("subs");
        if (doc) {
            var subsAry = doc.subs;
            subsAry.forEach(function (id) {
                subs.push(id);
            });
        }
        return subs;
    }

    /**
     * Get the names of the current channel data namespaces associated with the channel.
     * @returns {Array<string>}
     */
    getNamespaces() {
        var names = [];
        Object.keys(this.keySpaces).forEach(function (key) {
            if (key !== '_meta') {
                names.push(key);
            }
        });
        return names;
    }

    /**
     * Send a message to the channel. Payload can be any JSON object.
     * @param payload
     * @param callback
     */
    publish(payload, callback) {
        // this is how you send stuff to channel
        // probably needs options
        // "for now" it has to be a JSON object
        if (this.hasPermission("Publish")) {
            this.publishByteArray(new pew.ByteArray(pew.base64_encode(JSON.stringify(payload))));
            if (callback) {
                var err = null;
                callback(err);
            }
        }
        else {
            if (callback) {
                callback(new ChannelError("No permission to publish on channel."));
            }
        }
    }

    /**
     * Unsubscribe from the specified channel.
     * @param channel
     */
    unsubscribe(callback) {
        var msg = new wire.WireChannelUnSubscribe();
        msg.name = this.getName();
        this.client.sendToServer(msg);
        this.unsubscribeCallback = callback;
    }

    ////////////////////////////////////////////////////////////////////////////
    // End of public interface
    ////////////////////////////////////////////////////////////////////////////
    onWireChannelMessage(msg) {
        var channelMessage = new ChannelMessage();
        channelMessage.channel = this;
        channelMessage.payload = msg.payload;
        channelMessage.senderId = msg.senderId;
        this.emit('message', channelMessage);
    }

    onWireQueueMessage(msg) {
        if (msg.id) {
            var wrapper = this.responses[msg.id];
            if (wrapper) {
                delete this.responses[msg.id];
                if (wrapper.type == "json") {
                    wrapper.callback(JSON.parse(pew.base64_decode(msg.payload.getBytesAsBase64())));
                }
                else if (wrapper.type == "bytes") {
                }
                else if (wrapper.type == "string") {
                }
                else {
                    console.error("Failed wire queue message.");
                }
            }
        }
        else {
            console.error("Error mapping response id " + msg.id);
        }
    }

    onWireChannelDataCreate(msg) {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataCreate(msg);
    }

    onWireChannelDataUpdate(msg) {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataUpdate(msg);
    }

    onWireChannelDataDelete(msg) {
        var channelData = this.getOrCreateChannelData(msg.ks);
        channelData.onWireChannelDataDelete(msg);
    }

    onWireChannelLeave(msg) {
        if (this.unsubscribeCallback) {
            this.unsubscribeCallback();
        }
    }

    setChannelPermissions(perms) {
        this.channelPermissions = perms;
    }

    hasPermission(p) {
        var ret = false;
        this.channelPermissions.forEach(function (perm) {
            if (p == perm) {
                ret = true;
            }
        });
        return ret;
    }

    diff(a1, a2) {
        var a = [], diff = [];
        for (var i = 0; i < a1.length; i++)
            a[a1[i]] = true;
        for (var i = 0; i < a2.length; i++)
            if (a[a2[i]])
                delete a[a2[i]];
            else
                a[a2[i]] = true;
        for (var k in a)
            diff.push(k);
        return diff;
    }

    listChanged(orig, current) {
        var result = [];
        orig.forEach(function (key) {
            if (-1 === current.indexOf(key)) {
                result.push(key);
            }
        }, this);
        return result;
    }

    metaKeyspace() {
        return this.keySpaces["_meta"];
    }

    publishByteArray(payload) {
        var msg = new wire.WireChannelMessage();
        msg.name = this.name;
        msg.payload = payload;
        this.client.sendToServer(msg);
    }

    getOrCreateChannelData(ks) {
        var cd;
        //backstop for default keyspace
        if (!ks || "def" == ks) {
            cd = this.keySpaces["def"];
        }
        else {
            cd = this.keySpaces[ks];
        }
        if (!cd) {
            cd = new ChannelData(this.client, ks, this);
            this.keySpaces[ks] = cd;
            this.emit('addNamespace', cd);
        }
        return cd;
    }
}

module.exports = Channel;