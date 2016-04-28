///<reference path="PewRuntime.ts"/>
///<reference path="WireProtocol.Protocol.ts"/>
///<reference path="node.d.ts"/>
///<reference path="sockjs.d.ts"/>
import * as url from "url";
import * as bigbang from "./BigBangClient";
export class Client extends bigbang.AbstractBigBangClient {
    constructor(appUrl) {
        super(appUrl);
    }
    connect(callback) {
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
    connectAsDevice(id, secret, callback) {
        var parsedUrl = this.parseUrl(this._appUrl);
        var host = parsedUrl.host;
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
    createUser(email, password, callback) {
        var parsedUrl = url.parse(this._appUrl);
        var uri = this._appUrl;
        uri += "/api/v1/createUserEmailPassword";
        var requestBody = {
            email: email,
            password: password,
        };
        this.xhr("POST", uri, requestBody, function (err, response) {
            if (err) {
                callback(new bigbang.CreateUserError(err));
                return;
            }
            if (response.created) {
                callback(null);
            }
            else {
                callback(new bigbang.CreateUserError(response.userMessage));
            }
        });
    }
    resetPassword(email, callback) {
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
            }
            else {
                callback(new bigbang.ResetPasswordError(response.userMessage));
            }
        });
    }
    createDevice(tags, callback) {
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
    }
    authenticateDevice(id, secret, callback) {
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
    }
    internalLogin(protocol, host, user, password, application, callback) {
        var hostname = host.split(":")[0];
        var port = host.split(":")[1];
        var protocolHash = this.wireProtocol.protocolHash;
        var uri = protocol + "://" + hostname + ":" + port;
        if (!user && !password) {
            uri += "/loginAnon?application=" + application + "&wireprotocolhash=" + protocolHash;
        }
        else {
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
        // Response handlers.
        xhr.onload = function () {
            var loginResult = new bigbang.LoginResult();
            var json = null;
            try {
                json = JSON.parse(xhr.responseText);
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
        };
        xhr.onerror = function () {
            var loginResult = new bigbang.LoginResult();
            loginResult.authenticated = false;
            loginResult.message = 'XHR error';
            return callback(loginResult);
        };
        xhr.send();
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
        if (protocol === "https") {
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
    createCORSRequest(method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.open(method, url, true);
        }
        else {
            // Otherwise, CORS is not supported by the browser.
            xhr = null;
        }
        return xhr;
    }
    xhr(method, url, body, callback) {
        var xhr = this.createCORSRequest(method, url);
        if (!xhr) {
            callback('CORS not supported', null);
            return;
        }
        xhr.onload = function () {
            try {
                var body = JSON.parse(xhr.responseText);
                callback(null, body);
            }
            catch (e) {
                callback(e, null);
            }
        };
        xhr.onerror = function () {
            return callback("XHR error", null);
        };
        if (body) {
            xhr.send(JSON.stringify(body));
        }
        else {
            xhr.send();
        }
    }
}
