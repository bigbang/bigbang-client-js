const http = require("http");
const https = require("https");
const bigbang = require("./BigBangClient");
const ws = require("faye-websocket");
const url = require("url");
const RestApiClient = require('./rest/index.js');


class NodeBigBangClient extends bigbang.AbstractBigBangClient {
    constructor(appUrl) {
        super(appUrl);
    }


    connectAsDevice(id, secret, callback) {
        // connect calls internalLogin
        // internalLogin's callback calls internalConnect
        // internalConnect sets it's callback to be called later
        // events call internalConnect's callback
        var parsedUrl = this.parseUrl(this._appUrl);
        var host = parsedUrl.host;
        host += ':' + parsedUrl.port;
        this.authenticateDevice(id, secret, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            if (result.authenticated) {
                this._deviceId = id;
                this.internalConnect(parsedUrl.protocol, host, result.clientKey, callback);
            }
            else {
                callback(err);
                return;
            }
        }.bind(this));
    }

    authenticateDevice(id, secret, callback) {
        var api = this._getRestClient();
        var body = new RestApiClient.AuthDeviceRequest();
        body.id = id;
        body.secret = secret;

        api.authDevice(body, (err, data, response)=> {
            if (err) {
                console.error(err);
                callback(new ConnectionError('Unable to authenticate device.'), null);
                return;
            }
            else {
                const json = response.body;
                callback(null, json);
                return;
            }
        });
    }

    connect(callback) {
        // connect calls internalLogin
        // internalLogin's callback calls internalConnect
        // internalConnect sets it's callback to be called later
        // events call internalConnect's callback
        var parsedUrl = this.parseUrl(this._appUrl);
        var host = parsedUrl.host;
        host += ':' + parsedUrl.port;
        var user = null;
        var password = null;
        this.internalLogin(parsedUrl.protocol, host, user, password, host, (loginResult) => {
            if (loginResult.authenticated) {
                this.internalConnect(parsedUrl.protocol, host, loginResult.clientKey, callback);
            }
            else {
                var err = new bigbang.ConnectionError(loginResult.message);
                callback(err);
            }
        });
    }

    createUser(email, password, callback) {
        var parsedUrl = url.parse(this._appUrl);
        var uri = this._appUrl;
        uri += "/api/v1/createUserEmailPassword";
        var requestBody = {
            email: email,
            password: password,
        };
        var requestString = JSON.stringify(requestBody);
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': requestString.length
        };
        var options = {
            hostname: parsedUrl.hostname,
            port: parseInt(parsedUrl.port),
            path: uri,
            headers: headers,
            method: 'POST'
        };
        var req = null;
        var responseHandler = function (res) {
            res.setEncoding("UTF-8");
            var responseStr = "";
            res.on('data', function (data) {
                responseStr += data;
            });
            res.on('end', function () {
                var json = null;
                try {
                    var json = JSON.parse(responseStr);
                    if (json.created) {
                        callback(null);
                    }
                    else {
                        callback(new bigbang.CreateUserError(json.message));
                    }
                }
                catch (e) {
                    console.error(e);
                    callback(new bigbang.CreateUserError("Invalid response.  Check your server URL and try again."));
                }
            });
        };
        if (parsedUrl.protocol == 'https') {
            req = https.request(options, responseHandler);
        }
        else {
            req = http.request(options, responseHandler);
        }
        req.on('error', function (e) {
            console.error(e);
            callback(new bigbang.CreateUserError("Invalid response.  Check your server URL and try again."));
        });
        req.write(requestString);
        req.end();
    }

    resetPassword(email, callback) {
        var parsedUrl = url.parse(this._appUrl);
        var uri = this._appUrl;
        uri += "/api/v1/resetPassword";
        var requestBody = {
            email: email
        };
        var requestString = JSON.stringify(requestBody);
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': requestString.length
        };
        var options = {
            hostname: parsedUrl.hostname,
            port: parseInt(parsedUrl.port),
            path: uri,
            headers: headers,
            method: 'POST'
        };
        var req = null;
        var responseHandler = function (res) {
            res.setEncoding("UTF-8");
            var responseStr = "";
            res.on('data', function (data) {
                responseStr += data;
            });
            res.on('end', function () {
                var json = null;
                try {
                    var json = JSON.parse(responseStr);
                    if (json.reset) {
                        callback(null);
                    }
                    else {
                        callback(new bigbang.ResetPasswordError(json.message));
                    }
                }
                catch (e) {
                    console.error(e);
                    callback(new bigbang.ResetPasswordError("Invalid response.  Check your server URL and try again."));
                }
            });
        };
        if (parsedUrl.protocol == 'https') {
            req = https.request(options, responseHandler);
        }
        else {
            req = http.request(options, responseHandler);
        }
        req.on('error', function (e) {
            console.error(e);
            callback(new bigbang.ResetPasswordError("Invalid response.  Check your server URL and try again."));
        });
        req.write(requestString);
        req.end();
    }

    internalLogin(protocol, host, user, password, application, callback) {
        var hostname = host.split(":")[0];
        var port = parseInt(host.split(":")[1]);
        var protocolHash = this.wireProtocol.protocolHash;
        var uri = protocol + "://" + hostname + ":" + port;
        if (!user && !password) {
            uri += "/loginAnon?application=" + application + "&wireprotocolhash=" + protocolHash;
        }
        else {
            uri += "/login?username=" + user + "&password=" + password + "&application=" + application + "&wireprotocolhash=" + protocolHash;
        }
        var options = {
            hostname: hostname,
            port: port,
            path: uri,
            method: 'GET'
        };
        var req = null;
        var responseHandler = function (res) {
            res.setEncoding("UTF-8");
            var responseStr = "";
            res.on('data', function (data) {
                responseStr += data;
            });
            res.on('end', function () {
                var loginResult = new bigbang.LoginResult();
                var json = null;
                try {
                    json = JSON.parse(responseStr);
                    loginResult.authenticated = json.authenticated;
                    loginResult.clientKey = json.clientKey;
                    loginResult.message = json.message;
                    callback(loginResult);
                }
                catch (e) {
                    loginResult.authenticated = false;
                    loginResult.message = e.message;
                    callback(loginResult);
                }
            });
        };
        if (protocol == 'https') {
            req = https.request(options, responseHandler);
        }
        else {
            req = http.request(options, responseHandler);
        }
        req.on('error', function (e) {
            var loginResult = new bigbang.LoginResult();
            loginResult.authenticated = false;
            loginResult.message = e.message;
            return callback(loginResult);
        });
        req.end();
    }

    internalConnect(protocol, host, clientKey, callback) {
        this._clientKey = clientKey;
        //TODO could be more elegant here.
        var deviceCalled = false;
        if (this._deviceId) {
            this._internalConnectionResult = (cr) => {
                this.getDeviceChannel((channel) => {
                    if (!deviceCalled) {
                        if (cr.success) {
                            deviceCalled = true;
                            callback(null);
                            return;
                        }
                        else {
                            deviceCalled = true;
                            callback(new bigbang.ConnectionError(cr.failureMessage));
                            return;
                        }
                    }
                });
            };
        }
        else {
            this._internalConnectionResult = (cr) => {
                if (cr.success) {
                    callback(null);
                    return;
                }
                else {
                    callback(new bigbang.ConnectionError(cr.failureMessage));
                    return;
                }
            };
        }
        if (protocol === "https") {
            this.socket = new ws.Client('wss://' + host + '/sjs/websocket');
        }
        else {
            this.socket = new ws.Client('ws://' + host + '/sjs/websocket');
        }
        this.socket.on('open', (event) => {
            this.onConnect();
        });
        this.socket.on('message', (message) => {
            this.onReceiveText(message.data);
        });
        this.socket.on('close', (event) => {
            this.emit('disconnected', false);
        });
        this.socket.on('error', (event) => {
            console.error(event);
        });
    }

    sendToServer(msg) {
        var s = this.wireProtocol.wrapNetstring(msg);
        this.socket.send(s);
    }
}


module.exports  = {
    Client: NodeBigBangClient
}