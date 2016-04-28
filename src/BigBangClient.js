const pew = require("./PewRuntime");
const wire = require("./WireProtocol.Protocol.js");
const RestApiClient = require('./rest/index.js');

export class SimpleEventEmitter {
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
export class LoginResult {
}
export class ConnectionError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}
export class CreateDeviceError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}
export class CreateDeviceInfo {
    constructor(id, secret, tags) {
        this.id = id;
        this.secret = secret;
        this.tags = tags;
    }
}
export class CreateUserError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}
export class ResetPasswordError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}
export class ConnectionResult {
}
class ResponseWrapper {
}
export class ChannelError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}
export class ChannelMessage {
}
/**
 * Channel
 *
 * @fires message When a message is received on the channel.
 * @fires join When someone joins the channel.
 * @fires leave When someone has left the channel.
 */
export class Channel extends SimpleEventEmitter {
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
        }
        return cd;
    }
}
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
export class ChannelData extends SimpleEventEmitter {
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
        if (!key) {
            callback(new ChannelError("ChannelData key cannot be null."));
            return;
        }
        else if (!value) {
            callback(new ChannelError("ChannelData value cannot be null."));
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

    /**
     * Remove the specified key and it's value.
     * @param key
     * @param callback
     */
    remove(key, callback) {
        if (!key) {
            callback(new ChannelError("ChannelData key cannot be null."));
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
export class AbstractBigBangClient extends SimpleEventEmitter {
    constructor(appUrl) {
        super();
        this.bufString = "";
        this._appUrl = appUrl;
        this.wireProtocol = new wire.WireProtocol();
        this.wireProtocol.listener = this;
        this.connect = this.connect.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.channelSubscribeMap = {};
        this.channelMap = {};
    }

    _getRestClient() {
        var api = new RestApiClient.DefaultApi();
        api.apiClient.basePath = this._appUrl + '/api/v1';
        return api;
    }

    connect(url, options, callback) {
        throw new Error("abstract");
    }

    connectAsDevice(id, secret, callback) {
        throw new Error('abstract');

    }

    createUser(email, password, callback) {
        throw new Error("abstract");
    }

    resetPassword(email, callback) {
        throw new Error("abstract");
    }

    createDevice(tags, callback) {
        var api = this._getRestClient();
        var body = new RestApiClient.CreateDeviceRequest();
        body.tags = tags;

        api.create(body, (err, data, response) => {
            if (err) {
                console.error(err);
                callback(new CreateDeviceError("Invalid response.  Check your server URL and try again."), null);
                return;
            } else {
                const json = response.body;
                callback(null, new CreateDeviceInfo(json.id, json.secret, json.tags));
                return;
            }
        });
    }

    disconnect() {
        this.sendToServer(new wire.WireDisconnectRequest());
    }

    subscribe(channel, options, callback) {
        if (options instanceof Function) {
            callback = options;
            options = null;
        }
        this.channelSubscribeMap[channel] = callback;
        var msg = new wire.WireChannelSubscribe();
        msg.name = channel;
        this.sendToServer(msg);
    }

    getClientId() {
        return this._clientId;
    }

    getChannel(channel) {
        return this.channelMap[channel];
    }

    getDeviceChannel(callback) {
        var c = this.getChannel(this._deviceId);
        if (c) {
            callback(c);
            return;
        }
        else {
            this.subscribe(this._deviceId, (err, channel) => {
                callback(channel);
                return;
            });
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // End of public interface
    ////////////////////////////////////////////////////////////////////////////
    sendToServer(msg) {
        throw new Error("Unimplemented: sendToServer");
    }

    onConnect() {
        var req = new wire.WireConnectRequest();
        req.clientKey = this._clientKey;
        req.version = 1234;
        this.sendToServer(req);
    }

    publish(channel, payload) {
        var msg = new wire.WireChannelMessage();
        msg.name = channel;
        msg.payload = new pew.ByteArray(pew.base64_encode(payload));
        this.sendToServer(msg);
    }

    onReceiveText(data) {
        //tack it on, yo
        this.bufString += data;
        while (this.parseTextStream()) {
        }
    }

    parseTextStream() {
        var delimIdx = this.bufString.indexOf(":");
        if (delimIdx != -1) {
            var lenStr = this.bufString.substr(0, delimIdx);
            var msgLen = parseInt(lenStr);
            //Save the earth, recycle.
            if (this.bufString.length < msgLen + 1 + delimIdx) {
                //just give up, leave the bufString alone for now..
                return false;
            }
            else {
                var body = this.bufString.substr(delimIdx + 1, msgLen + 1);
                var c = body.charAt(body.length - 1);
                if (c != ',') {
                    // TODO: need to explode and kill the client or something here..
                    console.error("TextProtocol decode exception, not terminated with comma");
                }
                var actualBody = body.substr(0, body.length - 1);
                //we actually have a message! Wheeee!
                this.wireProtocol.dispatchNetstring(actualBody);
                //pack up the leftovers.
                if (this.bufString.length > msgLen + 1 + delimIdx + 1) {
                    var left = this.bufString.substr(msgLen + 1 + delimIdx + 1);
                    this.bufString = left;
                    return true;
                }
                else {
                    this.bufString = "";
                    return false;
                }
            }
        }
        else {
            return false;
        }
    }

    onWireChannelJoin(msg) {
        var callback = this.channelSubscribeMap[msg.name];
        var channel = this.channelMap[msg.name];
        if (!channel) {
            channel = new Channel(this, msg.name);
        }
        channel.setChannelPermissions(msg.channelPermissions);
        this.channelMap[channel.getName()] = channel;
        if (!msg.success) {
            if (callback) {
                return callback(new ChannelError("Unable to join channel"), channel);
            }
        }
        if (callback) {
            callback(null, channel);
        }
    }

    onWireChannelLeave(msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireChannelLeave(msg);
    }

    onWireChannelMessage(msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireChannelMessage(msg);
    }

    onWireQueueMessage(msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireQueueMessage(msg);
    }

    onWireRpcMessage(msg) {
        // TODO
    }

    onWireConnectFailure(msg) {
        var cr = new ConnectionResult();
        cr.clientId = null;
        cr.success = false;
        cr.message = msg.failureMessage;
        this._internalConnectionResult(cr);
    }

    onWireConnectSuccess(msg) {
        this._clientId = msg.clientId;
        var cr = new ConnectionResult();
        cr.clientId = msg.clientId;
        cr.success = true;
        cr.message = null;
        this._internalConnectionResult(cr);
        //Start up clientToServerPing at specified rate
        setInterval(function () {
            this.sendToServer(new wire.WirePing());
        }.bind(this), msg.clientToServerPingMS);
    }

    onWireChannelDataCreate(msg) {
        var channel = this.channelMap[msg.name];
        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }
        channel.onWireChannelDataCreate(msg);
    }

    onWireChannelDataUpdate(msg) {
        var channel = this.channelMap[msg.name];
        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }
        channel.onWireChannelDataUpdate(msg);
    }

    onWireChannelDataDelete(msg) {
        var channel = this.channelMap[msg.name];
        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }
        channel.onWireChannelDataDelete(msg);
    }

    onWireChannelDataDel(msg) {
        console.log('Unimplemented: onWireChannelDataDel');
    }

    onWireChannelDataPut(msg) {
        console.log('Unimplemented: onWireChannelDataPut');
    }

    onWireDisconnectSuccess(msg) {
        this.emit('disconnected', false);
    }

    onWireChannelUnSubscribe(msg) {
        console.log("Unimplemented: onWireChannelUnSubscribe");
    }

    onWireDisconnectRequest(msg) {
        //not implemented on client
    }

    onWireConnectRequest(msg) {
        //not implemented on client
    }

    onWireChannelSubscribe(msg) {
        console.log('Unimplemented: onWireChannelSubscribe');
    }

    onWirePing(msg) {
        //Turn around and send it back.
        this.sendToServer(new wire.WirePong());
    }

    onWirePong(msg) {
        //Check for liveness at some point if we dont get answers.
    }

    /**
     * A terrible, temporary URL parser till we can find a good one that works
     * in Node and browser.
     * @param url
     */
    parseUrl(url) {
        url = url.replace(/\//g, '');
        var comps = url.split(':');
        var protocol = comps[0];
        var host = comps[1];
        var port = Number(comps[2]) || (protocol === 'http' ? 80 : 443);
        return {
            protocol: protocol,
            host: host,
            port: port
        };
    }
}
