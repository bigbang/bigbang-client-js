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

        this.internalLogin(parsedUrl.protocol, host, user, password, host, function (loginResult) {
            if (loginResult.authenticated) {
                _this.internalConnect(parsedUrl.protocol, host, loginResult.clientKey, callback);
            } else {
                var err = new bigbang.ConnectionError(loginResult.message);
                callback(err);
            }
        });
    };

    Client.prototype.internalLogin = function (protocol, host, user, password, application, callback) {
        var hostname = host.split(":")[0];
        var port = host.split(":")[1];

        var protocolHash = this.wireProtocol.protocolHash;

        var uri = protocol + "://" + hostname + ":" + port;

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

            var json = null;

            try  {
                json = JSON.parse(xhr.responseText);
                loginResult.authenticated = json.authenticated;
                loginResult.clientKey = json.clientKey;
                loginResult.message = json.message;

                callback(loginResult);
            } catch (e) {
                loginResult.authenticated = false;
                loginResult.message = e.message;
                callback(loginResult);
            }
        };

        xhr.onerror = function () {
            var loginResult = new bigbang.LoginResult();

            loginResult.authenticated = false;
            loginResult.message = 'XHR error';

            return callback(loginResult);
        };

        xhr.send();
    };

    Client.prototype.internalConnect = function (protocol, host, clientKey, callback) {
        var _this = this;
        this._internalConnectionResult = callback;
        this._clientKey = clientKey;

        var ws;

        if (protocol === "https") {
            ws = "wss://" + host + "/";
        } else {
            ws = "ws://" + host + "/";
        }

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
