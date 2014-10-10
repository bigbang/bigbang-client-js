!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.BigBang=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
        this.getOrCreateChannelData(msg.ks).onWireChannelDataDelete(msg);
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

    AbstractBigBangClient.prototype.unsubscribe = function (channel) {
        throw new Error("Unimplemented: unsubscribe");
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

},{"./PewRuntime":3,"./WireProtocol.Protocol":4}],2:[function(require,module,exports){
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var bigbang = require("./BigBangClient");

var Client = (function (_super) {
    __extends(Client, _super);
    function Client() {
        _super.call(this);
    }
    Client.prototype.connect = function (url, options, callback) {
        var _this = this;
        if (options instanceof Function) {
            callback = options;
            options = null;
        }

        if (url instanceof Object) {
            options = url;
            url = null;
        }

        var parsedUrl = this.parseUrl(url);

        var host = parsedUrl.host;
        host += ':' + parsedUrl.port;
        var user = null;
        var password = null;

        this.internalLogin(host, user, password, host, function (loginResult) {
            if (loginResult.authenticated) {
                _this.internalConnect(host, loginResult.clientKey, callback);
            } else {
                var err = new bigbang.ConnectionError(loginResult.message);
                callback(err);
            }
        });
    };

    Client.prototype.internalLogin = function (host, user, password, application, callback) {
        var hostname = host.split(":")[0];
        var port = host.split(":")[1];

        var protocolHash = this.wireProtocol.protocolHash;

        var uri = "http://" + hostname + ":" + port;

        if (!user && !password) {
            uri += "/loginAnon?application=" + application + "&wireprotocolhash=" + protocolHash;
        } else {
            uri += "/login?username=" + user + "&password=" + password + "&application=" + application + "&wireprotocolhash=" + protocolHash;
        }

        var xhr = this.createCORSRequest('GET', uri);
        if (!xhr) {
            var loginResult = new bigbang.LoginResult();

            loginResult.authenticated = false;
            loginResult.message = 'CORS not supported';

            return callback(loginResult);
            return;
        }

        xhr.onload = function () {
            var loginResult = new bigbang.LoginResult();
            var json = JSON.parse(xhr.responseText);

            loginResult.authenticated = json.authenticated;
            loginResult.clientKey = json.clientKey;
            loginResult.message = json.message;

            callback(loginResult);
        };

        xhr.onerror = function () {
            var loginResult = new bigbang.LoginResult();

            loginResult.authenticated = false;
            loginResult.message = 'XHR error';

            return callback(loginResult);
        };

        xhr.send();
    };

    Client.prototype.internalConnect = function (host, clientKey, callback) {
        var _this = this;
        this._internalConnectionResult = callback;
        this._clientKey = clientKey;
        var ws = "ws://" + host + "/";

        this.socket = new WebSocket(ws);

        this.socket.onopen = function (event) {
            setTimeout(function () {
                _this.onConnect();
            }, 0);
        };

        this.socket.onmessage = function (event) {
            var s = event.data.toString();
            _this.onReceiveText(s);
        };

        this.socket.onclose = function (event) {
            _this.emit('disconnected', false);
        };

        this.socket.onerror = function (event) {
            console.error("WebSocket error: " + event);
        };
    };

    Client.prototype.sendToServer = function (msg) {
        var s = this.wireProtocol.wrapNetstring(msg);
        if (this.socket) {
            this.socket.send(s);
        } else {
            console.error("Send while socket is null.");
        }
    };

    Client.prototype.onDisconnect = function (notify) {
        if (!notify) {
            this.socket.onclose = null;
        }

        this.socket.close();
    };

    Client.prototype.createCORSRequest = function (method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
            console.log("Not capturing XDomainRequest just yet..");
            throw new Error("Error, XDomainRequest support!");
        } else {
            xhr = null;
        }
        return xhr;
    };
    return Client;
})(bigbang.AbstractBigBangClient);
exports.Client = Client;

},{"./BigBangClient":1}],3:[function(require,module,exports){
var ByteArray = (function () {
    function ByteArray(payload) {
        this.base64string = payload;
    }
    ByteArray.prototype.getBytesAsBase64 = function () {
        return this.base64string;
    };

    ByteArray.prototype.getBytesAsUTF8 = function () {
        return exports.base64_decode(this.base64string);
    };

    ByteArray.prototype.getBytesAsJSON = function () {
        return JSON.parse(this.getBytesAsUTF8());
    };

    ByteArray.prototype.toJSON = function () {
        return this.base64string;
    };
    return ByteArray;
})();
exports.ByteArray = ByteArray;

function encodeNetstring(s) {
    return s.length + ":" + s + ",";
}
exports.encodeNetstring = encodeNetstring;

function decodeNetstring(s) {
    var idx = s.indexOf(":");
    var msgStr = s.substr(idx + 1);
    return msgStr.substr(0, msgStr.length - 1);
}
exports.decodeNetstring = decodeNetstring;

function base64_encode(data) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc = "", tmp_arr = [];

    if (!data) {
        return data;
    }

    do {
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while(i < data.length);

    enc = tmp_arr.join('');

    var r = data.length % 3;

    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
}
exports.base64_encode = base64_encode;

function base64_decode_slow(data) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, dec = "", tmp_arr = [];

    if (!data) {
        return data;
    }

    data += '';

    do {
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while(i < data.length);

    dec = tmp_arr.join('');

    return dec;
}
exports.base64_decode_slow = base64_decode_slow;

var b64_decode_fast_hash = {};
var b64_charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";

for (var i = 0; i < b64_charset.length; i++) {
    b64_decode_fast_hash[b64_charset.charAt(i)] = i;
}

function base64_decode_fast(data) {
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, dec = "", tmp_arr = [];

    if (!data) {
        return data;
    }

    do {
        h1 = b64_decode_fast_hash[data.charAt(i++)];
        h2 = b64_decode_fast_hash[data.charAt(i++)];
        h3 = b64_decode_fast_hash[data.charAt(i++)];
        h4 = b64_decode_fast_hash[data.charAt(i++)];

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while(i < data.length);

    dec = tmp_arr.join('');

    return dec;
}
exports.base64_decode_fast = base64_decode_fast;

function base64_decode(data) {
    return exports.base64_decode_fast(data);
}
exports.base64_decode = base64_decode;

},{}],4:[function(require,module,exports){
var pew = require("./PewRuntime");

var WireProtocol = (function () {
    function WireProtocol() {
        this.protocolId = 0;
        this.protocolHash = '6d57e4b8c8746db1711874a131731111';
    }
    WireProtocol.prototype.wrapNetstring = function (msg) {
        var msgStr = msg.messageType + ":" + msg.serializeJson();
        return pew.encodeNetstring(msgStr);
    };

    WireProtocol.prototype.dispatchNetstring = function (s) {
        var idx = s.indexOf(":");
        var msgBody = s.substr(idx + 1);
        var t = parseInt(s.substr(0, idx));

        switch (t) {
            case 0:
                var WireChannelDataCreate_msg = new WireChannelDataCreate();
                WireChannelDataCreate_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataCreate(WireChannelDataCreate_msg);

                break;
            case 1:
                var WireChannelDataDel_msg = new WireChannelDataDel();
                WireChannelDataDel_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataDel(WireChannelDataDel_msg);

                break;
            case 2:
                var WireChannelDataDelete_msg = new WireChannelDataDelete();
                WireChannelDataDelete_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataDelete(WireChannelDataDelete_msg);

                break;
            case 3:
                var WireChannelDataPut_msg = new WireChannelDataPut();
                WireChannelDataPut_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataPut(WireChannelDataPut_msg);

                break;
            case 4:
                var WireChannelDataUpdate_msg = new WireChannelDataUpdate();
                WireChannelDataUpdate_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataUpdate(WireChannelDataUpdate_msg);

                break;
            case 5:
                var WireChannelJoin_msg = new WireChannelJoin();
                WireChannelJoin_msg.deserializeJson(msgBody);
                this.listener.onWireChannelJoin(WireChannelJoin_msg);

                break;
            case 6:
                var WireChannelLeave_msg = new WireChannelLeave();
                WireChannelLeave_msg.deserializeJson(msgBody);
                this.listener.onWireChannelLeave(WireChannelLeave_msg);

                break;
            case 7:
                var WireChannelMessage_msg = new WireChannelMessage();
                WireChannelMessage_msg.deserializeJson(msgBody);
                this.listener.onWireChannelMessage(WireChannelMessage_msg);

                break;
            case 8:
                var WireChannelSubscribe_msg = new WireChannelSubscribe();
                WireChannelSubscribe_msg.deserializeJson(msgBody);
                this.listener.onWireChannelSubscribe(WireChannelSubscribe_msg);

                break;
            case 9:
                var WireChannelUnSubscribe_msg = new WireChannelUnSubscribe();
                WireChannelUnSubscribe_msg.deserializeJson(msgBody);
                this.listener.onWireChannelUnSubscribe(WireChannelUnSubscribe_msg);

                break;
            case 10:
                var WireConnectFailure_msg = new WireConnectFailure();
                WireConnectFailure_msg.deserializeJson(msgBody);
                this.listener.onWireConnectFailure(WireConnectFailure_msg);

                break;
            case 11:
                var WireConnectRequest_msg = new WireConnectRequest();
                WireConnectRequest_msg.deserializeJson(msgBody);
                this.listener.onWireConnectRequest(WireConnectRequest_msg);

                break;
            case 12:
                var WireConnectSuccess_msg = new WireConnectSuccess();
                WireConnectSuccess_msg.deserializeJson(msgBody);
                this.listener.onWireConnectSuccess(WireConnectSuccess_msg);

                break;
            case 13:
                var WireDisconnectRequest_msg = new WireDisconnectRequest();
                WireDisconnectRequest_msg.deserializeJson(msgBody);
                this.listener.onWireDisconnectRequest(WireDisconnectRequest_msg);

                break;
            case 14:
                var WireDisconnectSuccess_msg = new WireDisconnectSuccess();
                WireDisconnectSuccess_msg.deserializeJson(msgBody);
                this.listener.onWireDisconnectSuccess(WireDisconnectSuccess_msg);

                break;
            case 15:
                var WireQueueMessage_msg = new WireQueueMessage();
                WireQueueMessage_msg.deserializeJson(msgBody);
                this.listener.onWireQueueMessage(WireQueueMessage_msg);

                break;
            case 16:
                var WireRpcMessage_msg = new WireRpcMessage();
                WireRpcMessage_msg.deserializeJson(msgBody);
                this.listener.onWireRpcMessage(WireRpcMessage_msg);

                break;
        }
    };
    return WireProtocol;
})();
exports.WireProtocol = WireProtocol;

var WireChannelDataCreate = (function () {
    function WireChannelDataCreate() {
        this.messageType = 0;
    }
    WireChannelDataCreate.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataCreate.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelDataCreate.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataCreate.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataCreate.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataCreate.key_IS_SET = 1 << 0;
    WireChannelDataCreate.ks_IS_SET = 1 << 1;
    WireChannelDataCreate.name_IS_SET = 1 << 2;
    WireChannelDataCreate.payload_IS_SET = 1 << 3;
    return WireChannelDataCreate;
})();
exports.WireChannelDataCreate = WireChannelDataCreate;
var WireChannelDataDel = (function () {
    function WireChannelDataDel() {
        this.messageType = 1;
    }
    WireChannelDataDel.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataDel.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
    };

    WireChannelDataDel.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataDel.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataDel.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataDel.key_IS_SET = 1 << 0;
    WireChannelDataDel.ks_IS_SET = 1 << 1;
    WireChannelDataDel.name_IS_SET = 1 << 2;
    return WireChannelDataDel;
})();
exports.WireChannelDataDel = WireChannelDataDel;
var WireChannelDataDelete = (function () {
    function WireChannelDataDelete() {
        this.messageType = 2;
    }
    WireChannelDataDelete.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataDelete.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelDataDelete.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataDelete.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataDelete.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataDelete.key_IS_SET = 1 << 0;
    WireChannelDataDelete.ks_IS_SET = 1 << 1;
    WireChannelDataDelete.name_IS_SET = 1 << 2;
    WireChannelDataDelete.payload_IS_SET = 1 << 3;
    return WireChannelDataDelete;
})();
exports.WireChannelDataDelete = WireChannelDataDelete;
var WireChannelDataPut = (function () {
    function WireChannelDataPut() {
        this.messageType = 3;
    }
    WireChannelDataPut.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataPut.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelDataPut.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataPut.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataPut.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataPut.key_IS_SET = 1 << 0;
    WireChannelDataPut.ks_IS_SET = 1 << 1;
    WireChannelDataPut.name_IS_SET = 1 << 2;
    WireChannelDataPut.payload_IS_SET = 1 << 3;
    return WireChannelDataPut;
})();
exports.WireChannelDataPut = WireChannelDataPut;
var WireChannelDataUpdate = (function () {
    function WireChannelDataUpdate() {
        this.messageType = 4;
    }
    WireChannelDataUpdate.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataUpdate.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelDataUpdate.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataUpdate.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataUpdate.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataUpdate.key_IS_SET = 1 << 0;
    WireChannelDataUpdate.ks_IS_SET = 1 << 1;
    WireChannelDataUpdate.name_IS_SET = 1 << 2;
    WireChannelDataUpdate.payload_IS_SET = 1 << 3;
    return WireChannelDataUpdate;
})();
exports.WireChannelDataUpdate = WireChannelDataUpdate;
var WireChannelJoin = (function () {
    function WireChannelJoin() {
        this.messageType = 5;
    }
    WireChannelJoin.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelJoin.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
        this.success = obj.success;

        this.channelPermissions = obj.channelPermissions;

        this.errorMessage = obj.errorMessage;
    };

    WireChannelJoin.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelJoin.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelJoin.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelJoin.name_IS_SET = 1 << 0;
    WireChannelJoin.success_IS_SET = 1 << 1;
    WireChannelJoin.channelPermissions_IS_SET = 1 << 2;
    WireChannelJoin.errorMessage_IS_SET = 1 << 3;
    return WireChannelJoin;
})();
exports.WireChannelJoin = WireChannelJoin;
var WireChannelLeave = (function () {
    function WireChannelLeave() {
        this.messageType = 6;
    }
    WireChannelLeave.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelLeave.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
    };

    WireChannelLeave.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelLeave.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelLeave.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelLeave.name_IS_SET = 1 << 0;
    return WireChannelLeave;
})();
exports.WireChannelLeave = WireChannelLeave;
var WireChannelMessage = (function () {
    function WireChannelMessage() {
        this.messageType = 7;
    }
    WireChannelMessage.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelMessage.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.senderId = obj.senderId;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelMessage.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelMessage.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelMessage.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelMessage.senderId_IS_SET = 1 << 0;
    WireChannelMessage.name_IS_SET = 1 << 1;
    WireChannelMessage.payload_IS_SET = 1 << 2;
    return WireChannelMessage;
})();
exports.WireChannelMessage = WireChannelMessage;
var WireChannelSubscribe = (function () {
    function WireChannelSubscribe() {
        this.messageType = 8;
    }
    WireChannelSubscribe.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelSubscribe.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
        this.jsonConfig = obj.jsonConfig;
    };

    WireChannelSubscribe.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelSubscribe.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelSubscribe.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelSubscribe.name_IS_SET = 1 << 0;
    WireChannelSubscribe.jsonConfig_IS_SET = 1 << 1;
    return WireChannelSubscribe;
})();
exports.WireChannelSubscribe = WireChannelSubscribe;
var WireChannelUnSubscribe = (function () {
    function WireChannelUnSubscribe() {
        this.messageType = 9;
    }
    WireChannelUnSubscribe.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelUnSubscribe.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
    };

    WireChannelUnSubscribe.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelUnSubscribe.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelUnSubscribe.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelUnSubscribe.name_IS_SET = 1 << 0;
    return WireChannelUnSubscribe;
})();
exports.WireChannelUnSubscribe = WireChannelUnSubscribe;
var WireConnectFailure = (function () {
    function WireConnectFailure() {
        this.messageType = 10;
    }
    WireConnectFailure.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireConnectFailure.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.failureMessage = obj.failureMessage;
    };

    WireConnectFailure.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireConnectFailure.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireConnectFailure.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireConnectFailure.failureMessage_IS_SET = 1 << 0;
    return WireConnectFailure;
})();
exports.WireConnectFailure = WireConnectFailure;
var WireConnectRequest = (function () {
    function WireConnectRequest() {
        this.messageType = 11;
    }
    WireConnectRequest.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireConnectRequest.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.version = obj.version;
        this.clientKey = obj.clientKey;
    };

    WireConnectRequest.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireConnectRequest.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireConnectRequest.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireConnectRequest.version_IS_SET = 1 << 0;
    WireConnectRequest.clientKey_IS_SET = 1 << 1;
    return WireConnectRequest;
})();
exports.WireConnectRequest = WireConnectRequest;
var WireConnectSuccess = (function () {
    function WireConnectSuccess() {
        this.messageType = 12;
    }
    WireConnectSuccess.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireConnectSuccess.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.clientId = obj.clientId;
    };

    WireConnectSuccess.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireConnectSuccess.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireConnectSuccess.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireConnectSuccess.clientId_IS_SET = 1 << 0;
    return WireConnectSuccess;
})();
exports.WireConnectSuccess = WireConnectSuccess;
var WireDisconnectRequest = (function () {
    function WireDisconnectRequest() {
        this.messageType = 13;
    }
    WireDisconnectRequest.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireDisconnectRequest.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
    };

    WireDisconnectRequest.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireDisconnectRequest.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireDisconnectRequest.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    return WireDisconnectRequest;
})();
exports.WireDisconnectRequest = WireDisconnectRequest;
var WireDisconnectSuccess = (function () {
    function WireDisconnectSuccess() {
        this.messageType = 14;
    }
    WireDisconnectSuccess.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireDisconnectSuccess.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
    };

    WireDisconnectSuccess.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireDisconnectSuccess.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireDisconnectSuccess.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    return WireDisconnectSuccess;
})();
exports.WireDisconnectSuccess = WireDisconnectSuccess;
var WireQueueMessage = (function () {
    function WireQueueMessage() {
        this.messageType = 15;
    }
    WireQueueMessage.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireQueueMessage.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.id = obj.id;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireQueueMessage.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireQueueMessage.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireQueueMessage.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireQueueMessage.id_IS_SET = 1 << 0;
    WireQueueMessage.name_IS_SET = 1 << 1;
    WireQueueMessage.payload_IS_SET = 1 << 2;
    return WireQueueMessage;
})();
exports.WireQueueMessage = WireQueueMessage;
var WireRpcMessage = (function () {
    function WireRpcMessage() {
        this.messageType = 16;
    }
    WireRpcMessage.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireRpcMessage.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.id = obj.id;
        this.ns = obj.ns;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireRpcMessage.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireRpcMessage.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireRpcMessage.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireRpcMessage.id_IS_SET = 1 << 0;
    WireRpcMessage.ns_IS_SET = 1 << 1;
    WireRpcMessage.payload_IS_SET = 1 << 2;
    return WireRpcMessage;
})();
exports.WireRpcMessage = WireRpcMessage;

},{"./PewRuntime":3}]},{},[2])(2)
});