const http = require("http");
const https = require("https");
const bigbang = require("./BigBangClient");
const ws = require("faye-websocket");
const url = require("url");
const RestApiClient = require('./rest/index.js');
const Channel = require('./Channel');


class NodeBigBangClient extends bigbang.AbstractBigBangClient {
    constructor(appUrl) {
        super(appUrl);
    }

    connectAsDevice(id, secret, callback) {
        // connect calls internalLogin
        // internalLogin's callback calls internalConnect
        // internalConnect sets it's callback to be called later
        // events call internalConnect's callback
        var parsedUrl = this.parseAppURL()
        var host = parsedUrl.hostname;
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
                callback({message:"Authentication failed."});
                return;
            }
        }.bind(this));
    }

    connectAsUser(email, password, callback ) {

        var parsedUrl = this.parseAppURL()
        var host = parsedUrl.hostname;
        host += ':' + parsedUrl.port;
        this.authUser(email,password, (err, result) => {
            if(err) {{
                callback(err);
                return;
            }}

            if(result.authenticated) {
                this.internalConnect(parsedUrl.protocol, host, result.clientKey, callback);
            }
            else {
                callback(result.message);
                return;
            }
        })
    }



    connect(callback) {
        // connect calls internalLogin
        // internalLogin's callback calls internalConnect
        // internalConnect sets it's callback to be called later
        // events call internalConnect's callback

        var parsedUrl = this.parseAppURL()
        var host = parsedUrl.hostname;
        host += ':' + parsedUrl.port;
        var user = null;
        var password = null;
        this.internalLogin(parsedUrl.protocol, host, null, null, host, (loginResult) => {
            if (loginResult.authenticated) {
                this.internalConnect(parsedUrl.protocol, host, loginResult.clientKey, callback);
            }
            else {
                var err = new bigbang.ConnectionError(loginResult.message);
                callback(err);
            }
        });
    }

    internalLogin(protocol, host, user, password, application, callback) {

        if (!user && !password) {
            this.authAnon(callback);
        }
        else {
            this.authUser(user, password, callback);
        }

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
        if (protocol === "https:") {
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


module.exports = {
    Client: NodeBigBangClient
}