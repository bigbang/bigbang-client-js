var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var pew = require("./PewRuntime");
var wire = require("./WireProtocol.Protocol");

var SimpleEventEmitter = (function () {
    function SimpleEventEmitter() {
        this._listeners = {};
    }
    SimpleEventEmitter.prototype.on = function (event, listener) {
        var listeners = this._listeners[event];
        if (!listeners) {
            this._listeners[event] = listeners = [];
        }
        listeners.push(listener);
    };

    SimpleEventEmitter.prototype.emit = function (event, arg1, arg2, arg3) {
        var listeners = this._listeners[event];
        if (!listeners) {
            return;
        }
        listeners.forEach(function (listener) {
            listener(arg1, arg2, arg3);
        });
    };
    return SimpleEventEmitter;
})();
exports.SimpleEventEmitter = SimpleEventEmitter;


var LoginResult = (function () {
    function LoginResult() {
    }
    return LoginResult;
})();
exports.LoginResult = LoginResult;

var ConnectionError = (function () {
    function ConnectionError(msg) {
        this.message = msg;
    }
    ConnectionError.prototype.toString = function () {
        return this.message;
    };
    return ConnectionError;
})();
exports.ConnectionError = ConnectionError;

var ConnectionResult = (function () {
    function ConnectionResult() {
    }
    return ConnectionResult;
})();
exports.ConnectionResult = ConnectionResult;

var ResponseWrapper = (function () {
    function ResponseWrapper() {
    }
    return ResponseWrapper;
})();

var ChannelError = (function () {
    function ChannelError(msg) {
        this.message = msg;
    }
    ChannelError.prototype.toString = function () {
        return this.message;
    };
    return ChannelError;
})();
exports.ChannelError = ChannelError;

var ChannelMessage = (function () {
    function ChannelMessage() {
    }
    return ChannelMessage;
})();
exports.ChannelMessage = ChannelMessage;

var Channel = (function (_super) {
    __extends(Channel, _super);
    function Channel(client, name) {
        var _this = this;
        _super.call(this);
        this.unsubscribeCallback = null;
        this.client = client;
        this.name = name;
        this.responses = {};
        this.keySpaces = {};
        this.channelPermissions = [];
        this.currentSubscribers = [];

        this.keySpaces["_meta"] = new ChannelData(client, "_meta", this);
        this.keySpaces["def"] = new ChannelData(client, "def", this);

        this.metaKeyspace().on("subs", function (doc) {
            var self = _this;
            var oldSubs = _this.currentSubscribers;
            _this.currentSubscribers = _this.getSubscribers();

            var diff = _this.diff(oldSubs, _this.getSubscribers());

            diff.forEach(function (id) {
                if (oldSubs.indexOf(id) != -1) {
                    self.emit('leave', id);
                } else {
                    self.emit('join', id);
                }
            });
        });
    }
    Channel.prototype.getName = function () {
        return this.name;
    };

    Channel.prototype.getChannelData = function (namespace) {
        namespace = namespace || 'def';
        return this.getOrCreateChannelData(namespace);
    };

    Channel.prototype.getSubscribers = function () {
        var subs = [];
        var doc = this.metaKeyspace().get("subs");

        if (doc) {
            var subsAry = doc.subs;

            subsAry.forEach(function (id) {
                subs.push(id);
            });
        }
        return subs;
    };

    Channel.prototype.getNamespaces = function () {
        var names = [];

        Object.keys(this.keySpaces).forEach(function (key) {
            if (key !== '_meta') {
                names.push(key);
            }
        });

        return names;
    };

    Channel.prototype.publish = function (payload, callback) {
        if (this.hasPermission("Publish")) {
            this.publishByteArray(new pew.ByteArray(pew.base64_encode(JSON.stringify(payload))));
            if (callback) {
                var err = null;
                callback(err);
            }
        } else {
            if (callback) {
                callback(new ChannelError("No permission to publish on channel."));
            }
        }
    };

    Channel.prototype.unsubscribe = function (callback) {
        var msg = new wire.WireChannelUnSubscribe();
        msg.name = this.getName();
        this.client.sendToServer(msg);
        this.unsubscribeCallback = callback;
    };

    Channel.prototype.onWireChannelMessage = function (msg) {
        var channelMessage = new ChannelMessage();
        channelMessage.channel = this;
        channelMessage.payload = msg.payload;
        channelMessage.senderId = msg.senderId;
        this.emit('message', channelMessage);
    };

    Channel.prototype.onWireQueueMessage = function (msg) {
        if (msg.id) {
            var wrapper = this.responses[msg.id];

            if (wrapper) {
                delete this.responses[msg.id];

                if (wrapper.type == "json") {
                    wrapper.callback(JSON.parse(pew.base64_decode(msg.payload.getBytesAsBase64())));
                } else if (wrapper.type == "bytes") {
                } else if (wrapper.type == "string") {
                } else {
                    console.error("Failed wire queue message.");
                }
            }
        } else {
            console.error("Error mapping response id " + msg.id);
        }
    };

    Channel.prototype.onWireChannelDataCreate = function (msg) {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataCreate(msg);
    };

    Channel.prototype.onWireChannelDataUpdate = function (msg) {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataUpdate(msg);
    };

    Channel.prototype.onWireChannelDataDelete = function (msg) {
        var channelData = this.getOrCreateChannelData(msg.ks);

        channelData.onWireChannelDataDelete(msg);

        if (channelData.getKeys().length == 0) {
            delete this.keySpaces[msg.ks];
        }
    };

    Channel.prototype.onWireChannelLeave = function (msg) {
        if (this.unsubscribeCallback) {
            this.unsubscribeCallback();
        }
    };

    Channel.prototype.setChannelPermissions = function (perms) {
        this.channelPermissions = perms;
    };

    Channel.prototype.hasPermission = function (p) {
        var ret = false;

        this.channelPermissions.forEach(function (perm) {
            if (p == perm) {
                ret = true;
            }
        });

        return ret;
    };

    Channel.prototype.diff = function (a1, a2) {
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
    };

    Channel.prototype.listChanged = function (orig, current) {
        var result = [];

        orig.forEach(function (key) {
            if (-1 === current.indexOf(key)) {
                result.push(key);
            }
        }, this);

        return result;
    };

    Channel.prototype.metaKeyspace = function () {
        return this.keySpaces["_meta"];
    };

    Channel.prototype.publishByteArray = function (payload) {
        var msg = new wire.WireChannelMessage();
        msg.name = this.name;
        msg.payload = payload;
        this.client.sendToServer(msg);
    };

    Channel.prototype.getOrCreateChannelData = function (ks) {
        var cd;

        if (!ks || "def" == ks) {
            cd = this.keySpaces["def"];
        } else {
            cd = this.keySpaces[ks];
        }

        if (!cd) {
            cd = new ChannelData(this.client, ks, this);
            this.keySpaces[ks] = cd;
        }
        return cd;
    };
    return Channel;
})(SimpleEventEmitter);
exports.Channel = Channel;

var ChannelData = (function (_super) {
    __extends(ChannelData, _super);
    function ChannelData(client, keySpace, channel) {
        _super.call(this);
        this.client = client;
        this.keySpace = keySpace;
        this.elementMap = {};
        this.channel = channel;
        this.onWireChannelDataCreate.bind(this);
        this.onWireChannelDataDelete.bind(this);
        this.onWireChannelDataUpdate.bind(this);
    }
    ChannelData.prototype.get = function (key) {
        return this.elementMap[key];
    };

    ChannelData.prototype.put = function (key, value, callback) {
        if (!key) {
            callback(new ChannelError("ChannelData key cannot be null."));
            return;
        } else if (!value) {
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
        } else {
            if (callback) {
                callback(new ChannelError("No permission to put on this channel."));
            }
        }
    };

    ChannelData.prototype.remove = function (key, callback) {
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
        } else {
            if (callback) {
                callback(new ChannelError("No permission to del on this channel."));
            }
        }
    };

    ChannelData.prototype.getKeys = function () {
        var keys = [];

        for (var k in this.elementMap) {
            keys.push(k);
        }
        return keys;
    };

    ChannelData.prototype.onWireChannelDataCreate = function (msg) {
        var payload = msg.payload.getBytesAsUTF8();
        var o = JSON.parse(payload);
        this.elementMap[msg.key] = o;
        this.emit('add', msg.key, o);
        this.emit(msg.key, o, 'add');
    };

    ChannelData.prototype.onWireChannelDataUpdate = function (msg) {
        var payload = msg.payload.getBytesAsUTF8();
        var o = JSON.parse(payload);
        this.elementMap[msg.key] = o;
        this.emit('update', msg.key, o);
        this.emit(msg.key, o, 'update');
    };

    ChannelData.prototype.onWireChannelDataDelete = function (msg) {
        delete this.elementMap[msg.key];
        this.emit('remove', msg.key);
        this.emit(msg.key, null, 'remove');
    };
    return ChannelData;
})(SimpleEventEmitter);
exports.ChannelData = ChannelData;

var AbstractBigBangClient = (function (_super) {
    __extends(AbstractBigBangClient, _super);
    function AbstractBigBangClient() {
        _super.call(this);
        this.bufString = "";
        this.wireProtocol = new wire.WireProtocol();
        this.wireProtocol.listener = this;
        this.connect = this.connect.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.channelSubscribeMap = {};
        this.channelMap = {};
    }
    AbstractBigBangClient.prototype.connect = function (url, options, callback) {
        throw new Error("abstract");
    };

    AbstractBigBangClient.prototype.disconnect = function () {
        this.sendToServer(new wire.WireDisconnectRequest());
    };

    AbstractBigBangClient.prototype.subscribe = function (channel, options, callback) {
        if (options instanceof Function) {
            callback = options;
            options = null;
        }

        this.channelSubscribeMap[channel] = callback;
        var msg = new wire.WireChannelSubscribe();
        msg.name = channel;
        this.sendToServer(msg);
    };

    AbstractBigBangClient.prototype.getClientId = function () {
        return this._clientId;
    };

    AbstractBigBangClient.prototype.getChannel = function (channel) {
        return this.channelMap[channel];
    };

    AbstractBigBangClient.prototype.sendToServer = function (msg) {
        throw new Error("Unimplemented: sendToServer");
    };

    AbstractBigBangClient.prototype.onConnect = function () {
        var req = new wire.WireConnectRequest();
        req.clientKey = this._clientKey;
        req.version = 1234;
        this.sendToServer(req);
    };

    AbstractBigBangClient.prototype.publish = function (channel, payload) {
        var msg = new wire.WireChannelMessage();
        msg.name = channel;
        msg.payload = new pew.ByteArray(pew.base64_encode(payload));
        this.sendToServer(msg);
    };

    AbstractBigBangClient.prototype.onReceiveText = function (data) {
        this.bufString += data;
        while (this.parseTextStream()) {
        }
    };

    AbstractBigBangClient.prototype.parseTextStream = function () {
        var delimIdx = this.bufString.indexOf(":");

        if (delimIdx != -1) {
            var lenStr = this.bufString.substr(0, delimIdx);
            var msgLen = parseInt(lenStr);

            if (this.bufString.length < msgLen + 1 + delimIdx) {
                return false;
            } else {
                var body = this.bufString.substr(delimIdx + 1, msgLen + 1);

                var c = body.charAt(body.length - 1);
                if (c != ',') {
                    console.error("TextProtocol decode exception, not terminated with comma");
                }

                var actualBody = body.substr(0, body.length - 1);

                this.wireProtocol.dispatchNetstring(actualBody);

                if (this.bufString.length > msgLen + 1 + delimIdx + 1) {
                    var left = this.bufString.substr(msgLen + 1 + delimIdx + 1);
                    this.bufString = left;
                    return true;
                } else {
                    this.bufString = "";
                    return false;
                }
            }
        } else {
            return false;
        }
    };

    AbstractBigBangClient.prototype.onWireChannelJoin = function (msg) {
        var callback = this.channelSubscribeMap[msg.name];

        var channel = new Channel(this, msg.name);
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
    };

    AbstractBigBangClient.prototype.onWireChannelLeave = function (msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireChannelLeave(msg);
    };

    AbstractBigBangClient.prototype.onWireChannelMessage = function (msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireChannelMessage(msg);
    };

    AbstractBigBangClient.prototype.onWireQueueMessage = function (msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireQueueMessage(msg);
    };

    AbstractBigBangClient.prototype.onWireRpcMessage = function (msg) {
    };

    AbstractBigBangClient.prototype.onWireConnectFailure = function (msg) {
        var cr = new ConnectionResult();
        cr.clientId = null;
        cr.success = false;
        cr.message = msg.failureMessage;
        this._internalConnectionResult(cr);
    };

    AbstractBigBangClient.prototype.onWireConnectSuccess = function (msg) {
        this._clientId = msg.clientId;
        var cr = new ConnectionResult();
        cr.clientId = msg.clientId;
        cr.success = true;
        cr.message = null;
        this._internalConnectionResult(null, cr);

        setInterval(function () {
            this.sendToServer(new wire.WirePing());
        }.bind(this), msg.clientToServerPingMS);
    };

    AbstractBigBangClient.prototype.onWireChannelDataCreate = function (msg) {
        var channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataCreate(msg);
    };

    AbstractBigBangClient.prototype.onWireChannelDataUpdate = function (msg) {
        var channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataUpdate(msg);
    };

    AbstractBigBangClient.prototype.onWireChannelDataDelete = function (msg) {
        var channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataDelete(msg);
    };

    AbstractBigBangClient.prototype.onWireChannelDataDel = function (msg) {
        console.log('Unimplemented: onWireChannelDataDel');
    };

    AbstractBigBangClient.prototype.onWireChannelDataPut = function (msg) {
        console.log('Unimplemented: onWireChannelDataPut');
    };

    AbstractBigBangClient.prototype.onWireDisconnectSuccess = function (msg) {
        this.emit('disconnected', false);
    };

    AbstractBigBangClient.prototype.onWireChannelUnSubscribe = function (msg) {
        console.log("Unimplemented: onWireChannelUnSubscribe");
    };

    AbstractBigBangClient.prototype.onWireDisconnectRequest = function (msg) {
    };

    AbstractBigBangClient.prototype.onWireConnectRequest = function (msg) {
    };

    AbstractBigBangClient.prototype.onWireChannelSubscribe = function (msg) {
        console.log('Unimplemented: onWireChannelSubscribe');
    };

    AbstractBigBangClient.prototype.onWirePing = function (msg) {
        this.sendToServer(new wire.WirePong());
    };

    AbstractBigBangClient.prototype.onWirePong = function (msg) {
    };

    AbstractBigBangClient.prototype.parseUrl = function (url) {
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
    };
    return AbstractBigBangClient;
})(SimpleEventEmitter);
exports.AbstractBigBangClient = AbstractBigBangClient;
