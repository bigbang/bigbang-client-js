///<reference path="PewRuntime.ts"/>
///<reference path="WireProtocol.Protocol.ts"/>
///<reference path="node.d.ts"/>
///<reference path="websocket.d.ts"/>
import pew = require("./PewRuntime");
import wire = require("./WireProtocol.Protocol");
import http = require("http");
import https = require("https");
import net = require("net");
import bigbang = require("./BigBangClient");
import ws = require("faye-websocket");
import url = require("url");

export class Client extends bigbang.AbstractBigBangClient implements wire.WireProtocolProtocolListener {

    private socket;

    constructor(appUrl:string) {
        super(appUrl);
    }

    connect(options?:any, callback?:(err:bigbang.ConnectionError) => any):void {
        // connect calls internalLogin
        // internalLogin's callback calls internalConnect
        // internalConnect sets it's callback to be called later
        // events call internalConnect's callback
        if (options instanceof Function) {
            callback = options;
            options = null;
        }

        var parsedUrl = this.parseUrl(this._appUrl);

        var host = parsedUrl.host;
        host += ':' + parsedUrl.port;
        var user = null;
        var password = null;

        this.internalLogin(parsedUrl.protocol, host, user, password, host, (loginResult:bigbang.LoginResult) => {
            if (loginResult.authenticated) {
                this.internalConnect(parsedUrl.protocol, host, loginResult.clientKey, callback);
            }
            else {
                var err:bigbang.ConnectionError = new bigbang.ConnectionError(loginResult.message);
                callback(err);
            }
        });
    }

    createUser(email:string, password:string, callback?:(err:bigbang.CreateUserError) => any):void {

        var parsedUrl = url.parse(this._appUrl);
        var uri:string = this._appUrl;

        uri += "/api/v1/createUserEmailPassword";

        var requestBody = {
            email: email,
            password: password,
        }

        var requestString = JSON.stringify(requestBody);

        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': requestString.length
        };

        var options = {
            hostname: parsedUrl.hostname,
            port: parseInt(parsedUrl.port),
            path: uri,
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
                var json:any = null;

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
        }


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

    resetPassword( email:String, callback?:(err:bigbang.ResetPasswordError) => any):void {
        var parsedUrl = url.parse(this._appUrl);

        var uri:string = this._appUrl;

        uri += "/api/v1/resetPassword";

        var requestBody = {
            email: email
        }

        var requestString = JSON.stringify(requestBody);

        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': requestString.length
        };

        var options = {
            hostname: parsedUrl.hostname,
            port: parseInt(parsedUrl.port),
            path: uri,
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
                var json:any = null;

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
        }


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


    internalLogin(protocol:string, host:string, user:string, password:string, application:string, callback:(loginResult:bigbang.LoginResult) =>any) {
        var hostname = host.split(":")[0];
        var port = parseInt(host.split(":")[1]);

        var protocolHash = this.wireProtocol.protocolHash

        var uri:string = protocol + "://" + hostname + ":" + port;

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
                var loginResult:bigbang.LoginResult = new bigbang.LoginResult();

                var json:any = null;

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
        }

        if (protocol == 'https') {
            req = https.request(options, responseHandler);
        }
        else {
            req = http.request(options, responseHandler);
        }

        req.on('error', function (e) {
            var loginResult:bigbang.LoginResult = new bigbang.LoginResult();

            loginResult.authenticated = false;
            loginResult.message = e.message;

            return callback(loginResult);
        });

        req.end();
    }

    internalConnect(protocol:string, host:string, clientKey:string, callback:(err:bigbang.ConnectionError) =>any):void {
        this._internalConnectionResult = callback;
        this._clientKey = clientKey;

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
        })
    }

    sendToServer(msg:pew.PewMessage):void {
        var s:string = this.wireProtocol.wrapNetstring(msg);
        this.socket.send(s);
    }
}
