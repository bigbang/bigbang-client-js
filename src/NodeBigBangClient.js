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

    internalConnect(protocol, host, clientKey, callback) {
        this._clientKey = clientKey;

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