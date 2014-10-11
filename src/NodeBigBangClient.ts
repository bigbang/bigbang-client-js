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
import ws = require("websocket");

export class Client extends bigbang.AbstractBigBangClient implements wire.WireProtocolProtocolListener {

    private socket;
    private connection;

    constructor() {
        super();
    }

    connect(url:any, options?:any, callback?:(err:bigbang.ConnectionError) => any):void {
        // connect calls internalLogin
        // internalLogin's callback calls internalConnect
        // internalConnect sets it's callback to be called later
        // events call internalConnect's callback
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
        var port = parseInt( host.split(":")[1] );

        var protocolHash = this.wireProtocol.protocolHash

        var uri:string = protocol +"://"+ hostname + ":" + port;

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

        if( protocol == 'https') {
            var req = https.request(options, function (res) {
                res.on('data', function (data) {
                    var loginResult:bigbang.LoginResult = new bigbang.LoginResult();
                    var json = JSON.parse(data);

                    loginResult.authenticated = json.authenticated;
                    loginResult.clientKey = json.clientKey;
                    loginResult.message = json.message;

                    callback(loginResult);
                });
            });

            req.on('error', function (e) {
                var loginResult:bigbang.LoginResult = new bigbang.LoginResult();

                loginResult.authenticated = false;
                loginResult.message = e.message;

                return callback(loginResult);
            });

            req.end();
        }
        else {
           var req = http.request(options, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (data) {
                    var loginResult:bigbang.LoginResult = new bigbang.LoginResult();
                    var json = JSON.parse(data);

                    loginResult.authenticated = json.authenticated;
                    loginResult.clientKey = json.clientKey;
                    loginResult.message = json.message;

                    callback(loginResult);
                });
            });

            req.on('error', function (e) {
                var loginResult:bigbang.LoginResult = new bigbang.LoginResult();

                loginResult.authenticated = false;
                loginResult.message = e.message;

                return callback(loginResult);
            });

            req.end();
        }
    }

    internalConnect(protocol:string, host:string, clientKey:string, callback:(err:bigbang.ConnectionError) =>any):void {
        this._internalConnectionResult = callback;
        this._clientKey = clientKey;
        this.socket = new ws.client();

        this.socket.on('connectFailed', function (error) {
            callback(new bigbang.ConnectionError(error));
        });

        this.socket.on('connect', (connection) => {
            this.connection = connection;
            this.onConnect();

            connection.on('error', function (error) {
                console.log('connection error ' + error);
                // TODO: call disconnect?
            });

            connection.on('close', () => {
                this.emit('disconnected', false);
            });

            connection.on('message', (message) => {
                this.onReceiveText(message.utf8Data);
            });
        });

        if( protocol === "https") {
            this.socket.connect('wss://' + host);
        }
        else {
            this.socket.connect('ws://' + host);
        }
    }

    sendToServer(msg:pew.PewMessage):void {
        var s:string = this.wireProtocol.wrapNetstring(msg);
        this.connection.sendUTF(s);
    }
}
