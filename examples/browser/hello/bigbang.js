!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.bigbang=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var pew = _dereq_("./PewRuntime");
var wire = _dereq_("./WireProtocol.Protocol");

(function (_client) {
    var LoginResult = (function () {
        function LoginResult() {
        }
        return LoginResult;
    })();
    _client.LoginResult = LoginResult;

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
    _client.ChannelError = ChannelError;

    var ChannelMessage = (function () {
        function ChannelMessage() {
        }
        return ChannelMessage;
    })();
    _client.ChannelMessage = ChannelMessage;

    var ConnectionResult = (function () {
        function ConnectionResult() {
        }
        return ConnectionResult;
    })();
    _client.ConnectionResult = ConnectionResult;

    var Channel = (function () {
        function Channel(client) {
            this.client = client;
            this.responses = {};
            this.keySpaces = {};
            this.channelPermissions = [];
            this.currentSubscribers = [];

            this.keySpaces["_meta"] = new ChannelData(client, "_meta", this);
            this.keySpaces["def"] = new ChannelData(client, "def", this);
            this.channelData = this.keySpaces["def"];
        }
        Channel.prototype.subscribers = function () {
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

        Channel.prototype.onMessage = function (message) {
            this.onMessageHandler = message;
        };

        Channel.prototype.onSubscribers = function (join, leave) {
            var _this = this;
            this.metaKeyspace().on("subs", function (doc) {
                var oldSubs = _this.currentSubscribers;
                _this.currentSubscribers = _this.subscribers();

                var diff = _this.diff(oldSubs, _this.subscribers());

                diff.forEach(function (id) {
                    if (oldSubs.indexOf(id) != -1) {
                        leave(id);
                    } else {
                        join(id);
                    }
                });
            }, null);
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

        Channel.prototype.getKeyspace = function (ks) {
            return this.getOrCreateChannelData(ks);
        };

        Channel.prototype.setChannelPermissions = function (perms) {
            this.channelPermissions = perms;
        };

        Channel.prototype.metaKeyspace = function () {
            return this.keySpaces["_meta"];
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

        Channel.prototype.publishByteArray = function (payload) {
            var msg = new wire.WireChannelMessage();
            msg.name = this.name;
            msg.payload = payload;
            this.client.sendToServer(msg);
        };

        Channel.prototype.send = function (payload, callback) {
            var msg = new wire.WireQueueMessage();
            msg.id = null;
            msg.name = this.name;
            msg.payload = new pew.ByteArray(pew.base64_encode(JSON.stringify(payload)));

            if (callback) {
                msg.id = this.randomRequestId();
                var wrapper = new ResponseWrapper();
                wrapper.type = "json";
                wrapper.callback = callback;
                this.responses[msg.id] = wrapper;
            }

            this.client.sendToServer(msg);
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

        Channel.prototype.onWireChannelMessage = function (msg) {
            if (this.onMessageHandler) {
                var channelMessage = new client.ChannelMessage();
                channelMessage.channel = this;
                channelMessage.payload = msg.payload;
                channelMessage.senderId = msg.senderId;
                this.onMessageHandler(channelMessage);
            }
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

        Channel.prototype.onWireChannelDataCreate = function (msg) {
            this.getOrCreateChannelData(msg.ks).onWireChannelDataCreate(msg);
        };

        Channel.prototype.onWireChannelDataUpdate = function (msg) {
            this.getOrCreateChannelData(msg.ks).onWireChannelDataUpdate(msg);
        };

        Channel.prototype.onWireChannelDataDelete = function (msg) {
            this.getOrCreateChannelData(msg.ks).onWireChannelDataDelete(msg);
        };

        Channel.prototype.randomRequestId = function () {
            return Math.floor((Math.random() * 999999) + 1).toString();
        };
        return Channel;
    })();
    _client.Channel = Channel;

    var ChannelData = (function () {
        function ChannelData(client, keySpace, channel) {
            this.client = client;
            this.keySpace = keySpace;
            this.elementMap = {};
            this.updateMap = {};
            this.deleteMap = {};
            this.addListeners = [];
            this.updateListeners = [];
            this.delListeners = [];
            this.channel = channel;
        }
        ChannelData.prototype.get = function (key) {
            return this.elementMap[key];
        };

        ChannelData.prototype.keys = function () {
            var keys = [];

            for (var k in this.elementMap) {
                keys.push(k);
            }
            return keys;
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
                msg.name = this.channel.name;
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

        ChannelData.prototype.del = function (key, callback) {
            if (!key) {
                callback(new ChannelError("ChannelData key cannot be null."));
                return;
            }

            if (this.channel.hasPermission("DelChannelData")) {
                var del = new wire.WireChannelDataDel();
                del.key = key;
                del.ks = this.keySpace;
                del.name = this.channel.name;
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

        ChannelData.prototype.on = function (key, update, del) {
            if (update) {
                this.updateMap[key] = update;
            }

            if (del) {
                this.deleteMap[key] = del;
            }
        };

        ChannelData.prototype.onValue = function (create, update, del) {
            if (create) {
                this.addListeners.push(create);
            }

            if (update) {
                this.updateListeners.push(update);
            }

            if (del) {
                this.delListeners.push(del);
            }
        };

        ChannelData.prototype.onWireChannelDataCreate = function (msg) {
            var payload = msg.payload.getBytesAsUTF8();
            var o = JSON.parse(payload);
            this.elementMap[msg.key] = o;

            var update = this.updateMap[msg.key];

            if (update) {
                update(o);
            }

            this.addListeners.forEach(function (callback) {
                callback(msg.key, o);
            });
        };

        ChannelData.prototype.onWireChannelDataUpdate = function (msg) {
            var payload = msg.payload.getBytesAsUTF8();
            var o = JSON.parse(payload);
            this.elementMap[msg.key] = o;

            var update = this.updateMap[msg.key];

            if (update) {
                update(o);
            }

            this.updateListeners.forEach(function (callback) {
                callback(msg.key, o);
            });
        };

        ChannelData.prototype.onWireChannelDataDelete = function (msg) {
            delete this.elementMap[msg.key];
            var del = this.deleteMap[msg.key];

            if (del) {
                del();
            }

            delete this.deleteMap[msg.key];

            this.delListeners.forEach(function (callback) {
                callback(msg.key);
            });
        };
        return ChannelData;
    })();
    _client.ChannelData = ChannelData;

    var AbstractBigBangClient = (function () {
        function AbstractBigBangClient() {
            this.bufString = "";
            this.channelListeners = {};
            this.wireProtocol = new wire.WireProtocol();
            this.wireProtocol.listener = this;
            this.connect = this.connect.bind(this);
            this.onConnect = this.onConnect.bind(this);
            this.subscribe = this.subscribe.bind(this);
            this.channelSubscribeMap = {};
            this.channelMap = {};
        }
        AbstractBigBangClient.prototype.connect = function (host, user, password, callback) {
            throw new Error("abstract");
        };

        AbstractBigBangClient.prototype.connectAnonymous = function (host, callback) {
            throw new Error("abstract");
        };

        AbstractBigBangClient.prototype.sendToServer = function (msg) {
            throw new Error("abstract");
        };

        AbstractBigBangClient.prototype.subscribe = function (channelId, callback) {
            this.channelSubscribeMap[channelId] = callback;
            var msg = new wire.WireChannelSubscribe();
            msg.name = channelId;
            this.sendToServer(msg);
        };

        AbstractBigBangClient.prototype.unsubscribe = function (channelName) {
            throw new Error("Not implemented");
        };

        AbstractBigBangClient.prototype.getChannel = function (channelName) {
            return this.channelMap[channelName];
        };

        AbstractBigBangClient.prototype.onConnect = function () {
            var req = new wire.WireConnectRequest();
            req.clientKey = this._clientKey;
            req.version = 1234;
            this.sendToServer(req);
        };

        AbstractBigBangClient.prototype.onDisconnect = function (notify) {
            throw new Error("abstract");
        };

        AbstractBigBangClient.prototype.disconnect = function () {
            this.sendToServer(new wire.WireDisconnectRequest());
        };

        AbstractBigBangClient.prototype.disconnected = function (callback) {
            this._disconnectCallback = callback;
        };

        AbstractBigBangClient.prototype.publish = function (channel, payload) {
            var msg = new wire.WireChannelMessage();
            msg.name = channel;
            msg.payload = new pew.ByteArray(pew.base64_encode(payload));
            this.sendToServer(msg);
        };

        AbstractBigBangClient.prototype.clientId = function () {
            return this._clientId;
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

            var channel = new Channel(this);
            channel.name = msg.name;
            channel.setChannelPermissions(msg.channelPermissions);

            this.channelMap[channel.name] = channel;

            if (!msg.success) {
                throw new Error("Unable to join channel, redirect this error please");
            }

            if (callback) {
                callback(null, channel);
            }
        };

        AbstractBigBangClient.prototype.onWireChannelLeave = function (msg) {
            delete this.channelListeners[msg.name];
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
            this._internalConnectionResult(cr);
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
            console.log('implement me channeldatadel');
        };

        AbstractBigBangClient.prototype.onWireChannelDataPut = function (msg) {
            console.log('implement me channeledataput');
        };

        AbstractBigBangClient.prototype.onWireDisconnectSuccess = function (msg) {
            this.onDisconnect(false);
            if (this._disconnectCallback) {
                this._disconnectCallback();
            }
        };

        AbstractBigBangClient.prototype.onWireChannelUnSubscribe = function (msg) {
            console.log("implement me unsubscrube");
        };

        AbstractBigBangClient.prototype.onWireDisconnectRequest = function (msg) {
        };

        AbstractBigBangClient.prototype.onWireConnectRequest = function (msg) {
        };

        AbstractBigBangClient.prototype.onWireChannelSubscribe = function (msg) {
            console.log('implement me onchannelsubs');
        };
        return AbstractBigBangClient;
    })();
    _client.AbstractBigBangClient = AbstractBigBangClient;
})(exports.client || (exports.client = {}));
var client = exports.client;

},{"./PewRuntime":3,"./WireProtocol.Protocol":4}],2:[function(_dereq_,module,exports){
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var bigbang = _dereq_("./BigBangClient");

(function (client) {
    var BrowserBigBangClient = (function (_super) {
        __extends(BrowserBigBangClient, _super);
        function BrowserBigBangClient() {
            _super.call(this);
        }
        BrowserBigBangClient.prototype.connect = function (host, user, password, callback) {
            var _this = this;
            this.internalLogin(host, user, password, host, function (loginResult) {
                if (loginResult.authenticated) {
                    _this.internalConnect(host, loginResult.clientKey, callback);
                } else {
                    var rslt = new bigbang.client.ConnectionResult();
                    rslt.message = loginResult.message;
                    rslt.success = false;
                    callback(rslt);
                }
            });
        };

        BrowserBigBangClient.prototype.connectAnonymous = function (host, callback) {
            this.connect(host, null, null, callback);
        };

        BrowserBigBangClient.prototype.internalLogin = function (host, user, password, application, callback) {
            var hostname = host.split(":")[0];
            var port = host.split(":")[1];

            var protocolHash = this.wireProtocol.protocolHash;

            var url = "http://" + hostname + ":" + port;

            if (!user && !password) {
                url += "/loginAnon?application=" + application + "&wireprotocolhash=" + protocolHash;
            } else {
                url += "/login?username=" + user + "&password=" + password + "&application=" + application + "&wireprotocolhash=" + protocolHash;
            }

            var xhr = this.createCORSRequest('GET', url);
            if (!xhr) {
                alert('CORS not supported');
                return;
            }

            xhr.onload = function () {
                var loginResult = new bigbang.client.LoginResult();
                var json = JSON.parse(xhr.responseText);

                loginResult.authenticated = json.authenticated;
                loginResult.clientKey = json.clientKey;
                loginResult.message = json.message;

                callback(loginResult);
            };

            xhr.onerror = function () {
                alert('Woops, there was an error making the request.');
            };

            xhr.send();
        };

        BrowserBigBangClient.prototype.internalConnect = function (host, clientKey, callback) {
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
                if (_this._disconnectCallback) {
                    _this._disconnectCallback();
                }
            };

            this.socket.onerror = function (event) {
                console.error("WebSocket error: " + event);
            };
        };

        BrowserBigBangClient.prototype.onDisconnect = function (notify) {
            if (!notify) {
                this.socket.onclose = null;
            }

            this.socket.close();
        };

        BrowserBigBangClient.prototype.sendToServer = function (msg) {
            var s = this.wireProtocol.wrapNetstring(msg);

            if (this.socket) {
                this.socket.send(s);
            } else {
                console.error("Send while socket is null.");
            }
        };

        BrowserBigBangClient.prototype.createCORSRequest = function (method, url) {
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
        return BrowserBigBangClient;
    })(bigbang.client.AbstractBigBangClient);
    client.BrowserBigBangClient = BrowserBigBangClient;
})(exports.client || (exports.client = {}));
var client = exports.client;

},{"./BigBangClient":1}],3:[function(_dereq_,module,exports){
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

},{}],4:[function(_dereq_,module,exports){
var pew = _dereq_("./PewRuntime");

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

},{"./PewRuntime":3}]},{},[2])
(2)
});