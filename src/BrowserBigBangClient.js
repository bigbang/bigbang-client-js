const url = require("url");
const bigbang = require("./BigBangClient");
const SockJS = require("sockjs-client");

class BrowserBigBangClient extends bigbang.AbstractBigBangClient {
    constructor(appUrl) {
        super(appUrl);
    }

    connect(callback) {
        var parsedUrl = this.parseAppURL()
        var host = parsedUrl.hostname;
        host += ':' + parsedUrl.port;
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

    connectAsUser(email, password, callback) {
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


    connectAsDevice(id, secret, callback) {
        var parsedUrl = this.parseAppURL()
        var host = parsedUrl.hostname;
        host += ':' + parsedUrl.port;
        this.authenticateDevice(id, secret, (err, result) => {
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
        var ws;
        if (protocol === "https:") {
            ws = "https://" + host + "/sjs";
        }
        else {
            ws = "http://" + host + "/sjs";
        }
        this.socket = new SockJS(ws);
        this.socket.onopen = (event) => {
            setTimeout(() => {
                this.onConnect();
            }, 0);
        };
        this.socket.onmessage = (event) => {
            var s = event.data.toString();
            this.onReceiveText(s);
        };
        this.socket.onclose = (event) => {
            this.emit('disconnected', false);
        };
    }

    sendToServer(msg) {
        var s = this.wireProtocol.wrapNetstring(msg);
        if (this.socket) {
            this.socket.send(s);
        }
        else {
            console.error("Send while socket is null.");
        }
    }

    onDisconnect(notify) {
        if (!notify) {
            this.socket.onclose = null;
        }
        this.socket.close();
    }
}

module.exports = {
    Client: BrowserBigBangClient
}
