/// <reference path="PewRuntime.ts"/>
/// <reference path="WireProtocol.Protocol.ts"/>
/// <reference path="node.d.ts"/>
/// <reference path="websocket.d.ts"/>
import pew      = require("./PewRuntime");
import wire     = require("./WireProtocol.Protocol");
import http     = require("http");
import net      = require("net");
import bigbang  = require("./BigBangClient");
import ws       = require("websocket");

export class Client extends bigbang.client.AbstractBigBangClient implements wire.WireProtocolProtocolListener {

    private socket;
    private connection;

    constructor() {
        super();
    }

    connect(host:string, user:string, password:string, callback:(connectionResult:bigbang.client.ConnectionResult) =>any):void {
        this.login(host, user, password, host, (loginResult:bigbang.client.LoginResult) => {

            if (loginResult.authenticated) {
                this.internalConnect(host, loginResult.clientKey, callback);
            }
            else {
                var rslt:bigbang.client.ConnectionResult = new bigbang.client.ConnectionResult();
                rslt.message = loginResult.message;
                rslt.success = false;
                callback(rslt);
            }
        });
    }

    connectAnonymous(host:string, callback:(connectionResult:bigbang.client.ConnectionResult) =>any):void {
       this.connect(host, null, null, callback);
    }


    login(host:string, user:string, password:string, application:string, callback:(loginResult:bigbang.client.LoginResult) =>any) {

        var hostname = host.split(":")[0];
        var port = host.split(":")[1];

        var protocolHash = this.wireProtocol.protocolHash

        var uri:string = "http://" + hostname + ":" + port;


        if( !user && !password ) {
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

        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (data) {

                var loginResult:bigbang.client.LoginResult = new bigbang.client.LoginResult();
                var json = JSON.parse(data);

                loginResult.authenticated = json.authenticated;
                loginResult.clientKey = json.clientKey;
                loginResult.message = json.message;

                callback(loginResult);

            });
        });

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });

        req.end();
    }

    internalConnect(host:string, clientKey:string, callback:(connectionResult:bigbang.client.ConnectionResult) =>any):void {
        this._internalConnectionResult = callback;
        this._clientKey = clientKey;
        this.socket = new ws.client();


        this.socket.on('connectFailed', function (error) {
            console.log("websocket connect failed " + error);
        });

        this.socket.on('connect', (connection) => {
            //woo
            this.connection = connection;
            this.onConnect();

            connection.on('error', function (error) {
                console.log('connection error ' + error);
            });

            connection.on('close', () => {
                if (this._disconnectCallback) {
                    this._disconnectCallback();
                }
            });

            connection.on('message', (message) => {
                this.onReceiveText(message.utf8Data);
            });

        });

        this.socket.connect('ws://' + host);

    }

    sendToServer(msg:pew.PewMessage):void {
        var s:string = this.wireProtocol.wrapNetstring(msg);
        this.connection.sendUTF(s);
    }
}
