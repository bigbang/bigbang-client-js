///<reference path="PewRuntime.ts"/>
///<reference path="WireProtocol.Protocol.ts"/>
///<reference path="node.d.ts"/>
import pew = require("./PewRuntime");
import wire = require("./WireProtocol.Protocol");
import http = require("http");
import net = require("net");
import bigbang = require("./BigBangClient");

export class Client extends bigbang.AbstractBigBangClient implements wire.WireProtocolProtocolListener {

    private socket:WebSocket;

    constructor() {
        super();
    }

    connect(url:any, options?:any, callback?:(err:bigbang.ConnectionError) => any):void {
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

    internalLogin(protocol:string, host:string, user:string, password:string, application:string, callback:(loginResult:bigbang.LoginResult) =>any) {
        var hostname = host.split(":")[0];
        var port = host.split(":")[1];

        var protocolHash = this.wireProtocol.protocolHash

        var uri:string = protocol +"://" + hostname + ":" + port;

        if (!user && !password) {
            uri += "/loginAnon?application=" + application + "&wireprotocolhash=" + protocolHash;
        }
        else {
            uri += "/login?username=" + user + "&password=" + password + "&application=" + application + "&wireprotocolhash=" + protocolHash;
        }

        var xhr = this.createCORSRequest('GET', uri);
        if (!xhr) {
            var loginResult:bigbang.LoginResult = new bigbang.LoginResult();

            loginResult.authenticated = false;
            loginResult.message = 'CORS not supported';

            return callback(loginResult);
            return;
        }

        // Response handlers.
        xhr.onload = function () {
            var loginResult:bigbang.LoginResult = new bigbang.LoginResult();
            var json = JSON.parse(xhr.responseText);

            loginResult.authenticated = json.authenticated;
            loginResult.clientKey = json.clientKey;
            loginResult.message = json.message;

            callback(loginResult);
        };

        xhr.onerror = function () {
            var loginResult:bigbang.LoginResult = new bigbang.LoginResult();

            loginResult.authenticated = false;
            loginResult.message = 'XHR error';

            return callback(loginResult);
        };

        xhr.send();
    }

    internalConnect(protocol:string, host:string, clientKey:string, callback:(err:bigbang.ConnectionError) =>any):void {
        this._internalConnectionResult = callback;
        this._clientKey = clientKey;

        var ws:string;

        if(protocol === "https" ) {
            ws = "wss://" + host + "/";
        }
        else {
            ws = "ws://" + host + "/";
        }

        this.socket = new WebSocket(ws);

        this.socket.onopen = (event) => {
            setTimeout(()=> {
                this.onConnect();
            }, 0);
        };

        this.socket.onmessage = (event) => {
            var s:string = event.data.toString();
            this.onReceiveText(s);
        };

        this.socket.onclose = (event) => {
            this.emit('disconnected', false);
        };

        this.socket.onerror = function (event) {
            console.error("WebSocket error: " + event);
            // TODO: call disconnect?
        };
    }

    sendToServer(msg:pew.PewMessage):void {
        var s:string = this.wireProtocol.wrapNetstring(msg);
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
        } else if (typeof XDomainRequest != "undefined") {
            // Otherwise, check if XDomainRequest.
            // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
            // xhr = new XDomainRequest();
            // xhr.open(method, url);
            console.log("Not capturing XDomainRequest just yet..");
            throw new Error("Error, XDomainRequest support!")
        } else {
            // Otherwise, CORS is not supported by the browser.
            xhr = null;
        }
        return xhr;
    }
}
