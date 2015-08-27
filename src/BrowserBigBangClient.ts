///<reference path="PewRuntime.ts"/>
///<reference path="WireProtocol.Protocol.ts"/>
///<reference path="node.d.ts"/>
///<reference path="sockjs.d.ts"/>

/*
 BSD LICENSE

 Copyright (c) 2015, Big Bang IO, LLC
 All rights reserved.

 Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


import pew = require("./PewRuntime");
import wire = require("./WireProtocol.Protocol");
import http = require("http");
import net = require("net");
import url = require("url");
import bigbang = require("./BigBangClient");


export class Client extends bigbang.AbstractBigBangClient implements wire.WireProtocolProtocolListener {

    private socket:SockJS;

    constructor(appUrl:string) {
        super(appUrl);
    }

    connect(callback:(err:bigbang.ConnectionError) => any):void {

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

        this.xhr("POST", uri, requestBody, function (err, response:any) {

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

    resetPassword(email:String, callback?:(err:bigbang.ResetPasswordError) => any):void {

        var parsedUrl = url.parse(this._appUrl);
        var uri:string = this._appUrl;

        uri += "/api/v1/resetPassword";

        var requestBody = {
            email: email
        }

        this.xhr("POST", uri, requestBody, function (err, response:any) {
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


    internalLogin(protocol:string, host:string, user:string, password:string, application:string, callback:(loginResult:bigbang.LoginResult) =>any) {
        var hostname = host.split(":")[0];
        var port = host.split(":")[1];

        var protocolHash = this.wireProtocol.protocolHash

        var uri:string = protocol + "://" + hostname + ":" + port;

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

            var json:any = null;

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

        if (protocol === "https") {
            ws = "https://" + host + "/_api/connect";
        }
        else {
            ws = "http://" + host + "/_api/connect";
        }

        this.socket = new SockJS(ws);

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

        /*
         this.socket.onerror = function (event) {
         console.error("WebSocket error: " + event);
         // TODO: call disconnect?
         };
         */
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
