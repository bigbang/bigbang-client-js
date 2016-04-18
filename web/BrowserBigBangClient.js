var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var url = require("url");
var bigbang = require("./BigBangClient");

var Client = (function (_super) {
    __extends(Client, _super);
    function Client(appUrl) {
        _super.call(this, appUrl);
    }
    Client.prototype.connect = function (callback) {
        var _this = this;
        var parsedUrl = this.parseUrl(this._appUrl);

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

    Client.prototype.connectAsDevice = function (id, secret, callback) {
        var _this = this;
        var parsedUrl = this.parseUrl(this._appUrl);

        var host = parsedUrl.host;
        host += ':' + parsedUrl.port;

        this.authenticateDevice(id, secret, function (err, result) {
            if (err) {
                callback(err);
                return;
            }

            if (result.authenticated) {
                _this._deviceId = id;
                _this.internalConnect(parsedUrl.protocol, host, result.clientKey, callback);
            } else {
                callback(err);
                return;
            }
        });
    };

    Client.prototype.createUser = function (email, password, callback) {
        var parsedUrl = url.parse(this._appUrl);
        var uri = this._appUrl;

        uri += "/api/v1/createUserEmailPassword";

        var requestBody = {
            email: email,
            password: password
        };

        this.xhr("POST", uri, requestBody, function (err, response) {
            if (err) {
                callback(new bigbang.CreateUserError(err));
                return;
            }

            if (response.created) {
                callback(null);
            } else {
                callback(new bigbang.CreateUserError(response.userMessage));
            }
        });
    };

    Client.prototype.resetPassword = function (email, callback) {
        var parsedUrl = url.parse(this._appUrl);
        var uri = this._appUrl;

        uri += "/api/v1/resetPassword";

        var requestBody = {
            email: email
        };

        this.xhr("POST", uri, requestBody, function (err, response) {
            if (err) {
                callback(new bigbang.ResetPasswordError(err));
                return;
            }

            if (response.reset) {
                callback(null);
            } else {
                callback(new bigbang.ResetPasswordError(response.userMessage));
            }
        });
    };

    Client.prototype.createDevice = function (tags, callback) {
        var parsedUrl = url.parse(this._appUrl);
        var uri = this._appUrl;

        uri += "/api/v1/createDevice";

        var requestBody = {
            tags: tags
        };

        this.xhr("POST", uri, requestBody, function (err, response) {
            if (err) {
                callback(new bigbang.CreateDeviceError(err), null);
                return;
            }

            callback(null, new bigbang.CreateDeviceInfo(response.id, response.secret, response.tags));
            return;
        });
    };

    Client.prototype.authenticateDevice = function (id, secret, callback) {
        var parsedUrl = url.parse(this._appUrl);
        var uri = this._appUrl;

        uri += "/api/v1/authDevice";

        var requestBody = {
            id: id,
            secret: secret
        };

        this.xhr("POST", uri, requestBody, function (err, response) {
            if (err) {
                callback(new bigbang.CreateUserError("Invalid response.  Check your server URL and try again."), null);
                return;
            }

            callback(null, response);
            return;
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
        this._clientKey = clientKey;

        var deviceCalled = false;

        if (this._deviceId) {
            this._internalConnectionResult = function (cr) {
                _this.getDeviceChannel(function (channel) {
                    if (!deviceCalled) {
                        if (cr.success) {
                            deviceCalled = true;
                            callback(null);
                            return;
                        } else {
                            deviceCalled = true;
                            callback(new bigbang.ConnectionError(cr.failureMessage));
                            return;
                        }
                    }
                });
            };
        } else {
            this._internalConnectionResult = function (cr) {
                if (cr.success) {
                    callback(null);
                    return;
                } else {
                    callback(new bigbang.ConnectionError(cr.failureMessage));
                    return;
                }
            };
        }

        var ws;

        if (protocol === "https") {
            ws = "https://" + host + "/sjs";
        } else {
            ws = "http://" + host + "/sjs";
        }

        this.socket = new SockJS(ws);

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

    Client.prototype.xhr = function (method, url, body, callback) {
        var xhr = this.createCORSRequest(method, url);

        if (!xhr) {
            callback('CORS not supported', null);
            return;
        }

        xhr.onload = function () {
            try  {
                var body = JSON.parse(xhr.responseText);
                callback(null, body);
            } catch (e) {
                callback(e, null);
            }
        };

        xhr.onerror = function () {
            return callback("XHR error", null);
        };

        if (body) {
            xhr.send(JSON.stringify(body));
        } else {
            xhr.send();
        }
    };
    return Client;
})(bigbang.AbstractBigBangClient);
exports.Client = Client;
