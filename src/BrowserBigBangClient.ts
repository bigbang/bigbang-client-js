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

    connect(host:string, user:string, password:string, callback:(connectionResult:bigbang.ConnectionResult) =>any):void {
        this.internalLogin(host, user, password, host, (loginResult:bigbang.LoginResult) => {

            if (loginResult.authenticated) {
                this.internalConnect(host, loginResult.clientKey, callback);
            }
            else {
                var rslt:bigbang.ConnectionResult = new bigbang.ConnectionResult();
                rslt.message = loginResult.message;
                rslt.success = false;
                callback(rslt);
            }
        });
    }

    connectAnonymous(host:string, callback:(connectionResult:bigbang.ConnectionResult) =>any):void {
        this.connect(host, null, null, callback);
    }

    internalLogin(host:string, user:string, password:string, application:string, callback:(loginResult:bigbang.LoginResult) =>any) {
        var hostname = host.split(":")[0];
        var port = host.split(":")[1];

        var protocolHash = this.wireProtocol.protocolHash

        var uri:string = "http://" + hostname + ":" + port;

        if (!user && !password) {
            uri += "/loginAnon?application=" + application + "&wireprotocolhash=" + protocolHash;
        }
        else {
            uri += "/login?username=" + user + "&password=" + password + "&application=" + application + "&wireprotocolhash=" + protocolHash;
        }

        var xhr = this.createCORSRequest('GET', uri);
        if (!xhr) {
            alert('CORS not supported');
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
            alert('Woops, there was an error making the request.');
        };

        xhr.send();
    }

    internalConnect(host:string, clientKey:string, callback:(connectionResult:bigbang.ConnectionResult) =>any):void {
        this._internalConnectionResult = callback;
        this._clientKey = clientKey;
        var ws:string = "ws://" + host + "/";

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
            if (this._disconnectCallback) {
                this._disconnectCallback();
            }
        };

        this.socket.onerror = function (event) {
            console.error("WebSocket error: " + event);
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
