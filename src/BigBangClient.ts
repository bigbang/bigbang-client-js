/// <reference path="PewRuntime.ts"/>
/// <reference path="WireProtocol.Protocol.ts"/>

import pew      = require("./PewRuntime");
import wire     = require("./WireProtocol.Protocol");

export interface BigBangClient {

    connect(host:string, user:string, password:string, callback:(connectionResult:ConnectionResult) =>any):void;

    connectAnonymous(host:string, callback:(connectionResult:ConnectionResult) =>any):void;

    subscribe(channel:string, callback:(err:ChannelError, channel:Channel) =>any):void;

    unsubscribe(channel:string):void;

    getChannel(channelName:string):Channel;

    disconnect():void;

    disconnected(callback:() =>any):void;

    clientId():string;

    //todo, dont let regular users see this
    sendToServer(msg:pew.PewMessage):void;
}

export class LoginResult {
    authenticated:boolean;
    clientKey:string;
    message:string;
}

class ResponseWrapper {
    type:string;
    callback:any;
}

export class ChannelError {

    message:string;

    constructor(msg:string) {
        this.message = msg;
    }

    toString():string {
        return this.message;
    }
}

export class ChannelMessage {
    senderId:string;
    channel:Channel;
    payload:pew.ByteArray;
}


export class ConnectionResult {
    success:boolean;
    clientId:string;
    message:string;
}

export class Channel {

    private client:BigBangClient;
    private responses:{ [name:string]: ResponseWrapper
    };
    private keySpaces:{ [name:string]: ChannelData
    }
    private channelPermissions:Array<string>;

    private currentSubscribers:Array<string>;


    private onMessageHandler:(msg:ChannelMessage) =>any;

    constructor(client:BigBangClient) {
        this.client = client;
        this.responses = {};
        this.keySpaces = {};
        this.channelPermissions = [];
        this.currentSubscribers = [];

        this.keySpaces["_meta"] = new ChannelData(client, "_meta", this);
        this.keySpaces["def"] = new ChannelData(client, "def", this);
        this.channelData = this.keySpaces["def"];
    }

    name:string;
    channelData:ChannelData;


    subscribers():Array<string> {
        var subs:Array<string> = [];
        var doc:any = this.metaKeyspace().get("subs");

        if (doc) {
            var subsAry:Array<string> = doc.subs;

            subsAry.forEach(function (id) {
                subs.push(id);
            });
        }
        return subs;
    }

    onMessage( message:(msg:ChannelMessage) => any):void {
        this.onMessageHandler = message;
    }


    onSubscribers(join:(s) => any, leave:(s) => any) {

        this.metaKeyspace().on("subs", (doc:any) => {

            var oldSubs:Array<string> = this.currentSubscribers;
            this.currentSubscribers = this.subscribers();

            var diff = this.diff(oldSubs, this.subscribers());

            diff.forEach(function (id) {
                if (oldSubs.indexOf(id) != -1) {
                    leave(id);
                }
                else {
                    join(id);
                }
            });
        }, null);
    }

    diff(a1, a2):Array<string> {
        var a = [], diff = [];
        for (var i = 0; i < a1.length; i++)
            a[a1[i]] = true;
        for (var i = 0; i < a2.length; i++)
            if (a[a2[i]]) delete a[a2[i]];
            else a[a2[i]] = true;
        for (var k in a)
            diff.push(k);
        return diff;
    }


    listChanged(orig:Array<string>, current:Array<string>):Array<string> {
        var result = [];

        orig.forEach(function (key) {
            if (-1 === current.indexOf(key)) {
                result.push(key);
            }
        }, this);

        return result;
    }


    getKeyspace(ks:string):ChannelData {
        return this.getOrCreateChannelData(ks);
    }

    setChannelPermissions(perms:Array<string>):void {
        this.channelPermissions = perms;
    }

    private metaKeyspace():ChannelData {
        return this.keySpaces["_meta"];
    }

    public publish(payload:any, callback:(err:ChannelError) => any):void {

        if (this.hasPermission("Publish")) {
            this.publishByteArray(new pew.ByteArray(pew.base64_encode(JSON.stringify(payload))));
            if (callback) {
                var err:ChannelError = null;
                callback(err);
            }
        }
        else {
            if (callback) {
                callback(new ChannelError("No permission to publish on channel."));
            }
        }
    }

    publishByteArray(payload:pew.ByteArray):void {
        var msg:wire.WireChannelMessage = new wire.WireChannelMessage();
        msg.name = this.name;
        msg.payload = payload;
        this.client.sendToServer(msg);
    }

    send(payload:any, callback:(response)=>any) {
        var msg:wire.WireQueueMessage = new wire.WireQueueMessage();
        msg.id = null;
        msg.name = this.name;
        msg.payload = new pew.ByteArray(pew.base64_encode(JSON.stringify(payload)));


        if (callback) {
            msg.id = this.randomRequestId();
            var wrapper:ResponseWrapper = new ResponseWrapper();
            wrapper.type = "json";
            wrapper.callback = callback;
            this.responses[msg.id] = wrapper;
        }

        this.client.sendToServer(msg);

    }

    hasPermission(p:string):boolean {

        var ret:boolean = false;

        this.channelPermissions.forEach(function (perm) {
            if (p == perm) {
                ret = true;
            }
        });

        return ret;
    }

    onWireChannelMessage(msg:wire.WireChannelMessage):void {
        if (this.onMessageHandler) {
            var channelMessage:ChannelMessage = new ChannelMessage();
            channelMessage.channel = this;
            channelMessage.payload = msg.payload;
            channelMessage.senderId = msg.senderId;
            this.onMessageHandler(channelMessage);
        }
    }

    onWireQueueMessage(msg:wire.WireQueueMessage):void {
        if (msg.id) {
            var wrapper:ResponseWrapper = this.responses[msg.id];

            if (wrapper) {
                delete this.responses[msg.id];

                if (wrapper.type == "json") {
                    wrapper.callback(JSON.parse(pew.base64_decode(msg.payload.getBytesAsBase64())));

                }
                else if (wrapper.type == "bytes") {

                }
                else if (wrapper.type == "string") {

                }
                else {
                    console.error("Failed wire queue message.")
                }
            }
        }
        else {
            console.error("Error mapping response id " + msg.id);
        }
    }

    private getOrCreateChannelData(ks:string):ChannelData {
        var cd:ChannelData;

        //backstop for default keyspace
        if (!ks || "def" == ks) {
            cd = this.keySpaces["def"];
        }
        else {
            cd = this.keySpaces[ks];
        }

        if (!cd) {
            cd = new ChannelData(this.client, ks, this);
            this.keySpaces[ks] = cd;
        }
        return cd;
    }

    onWireChannelDataCreate(msg:wire.WireChannelDataCreate):void {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataCreate(msg);
    }

    onWireChannelDataUpdate(msg:wire.WireChannelDataUpdate):void {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataUpdate(msg);
    }

    onWireChannelDataDelete(msg:wire.WireChannelDataDelete):void {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataDelete(msg);
    }

    private randomRequestId():string {
        //todo better id :)
        return Math.floor((Math.random() * 999999) + 1).toString();
    }

}


export class ChannelData {

    private client:BigBangClient;
    private keySpace:string;
    private channel:Channel;

    private elementMap:{ [key:string] : any
    }

    private updateMap:{ [key:string]: (o:any) =>any
    }

    private deleteMap:{[key:string]: () =>any
    }

    private addListeners:Array<any>;

    private updateListeners:Array<any>;

    private delListeners:Array<any>;


    constructor(client:BigBangClient, keySpace:string, channel:Channel) {
        this.client = client;
        this.keySpace = keySpace;
        this.elementMap = {};
        this.updateMap = {};
        this.deleteMap = {};
        this.addListeners = [];
        this.updateListeners = [];
        this.delListeners = [];
        this.channel = channel;
    }

    get(key:string):any {
        return this.elementMap[key];
    }


    keys():Array<string> {
        var keys = [];

        for (var k in this.elementMap) {
            keys.push(k);
        }
        return keys;
    }

    put(key:string, value:any, callback:(err:ChannelError)=>any) {

        if (!key) {
            callback(new ChannelError("ChannelData key cannot be null."));
            return;
        }
        else if (!value) {
            callback(new ChannelError("ChannelData value cannot be null."));
            return;
        }

        if (this.channel.hasPermission("PutChannelData")) {
            var msg:wire.WireChannelDataPut = new wire.WireChannelDataPut();
            msg.key = key;
            msg.ks = this.keySpace;
            msg.name = this.channel.name;
            msg.payload = new pew.ByteArray(pew.base64_encode(JSON.stringify(value)));
            this.client.sendToServer(msg);

            if (callback) {
                callback(null);
            }
        }
        else {
            if (callback) {
                callback(new ChannelError("No permission to put on this channel."));
            }
        }
    }

    del(key:string, callback:(err:ChannelError)=>any):any {

        if (!key) {
            callback(new ChannelError("ChannelData key cannot be null."));
            return;
        }

        if (this.channel.hasPermission("DelChannelData")) {
            var del:wire.WireChannelDataDel = new wire.WireChannelDataDel();
            del.key = key;
            del.ks = this.keySpace;
            del.name = this.channel.name;
            this.client.sendToServer(del);

            if (callback) {
                callback(null);
            }

        }
        else {
            if (callback) {
                callback(new ChannelError("No permission to del on this channel."));
            }
        }
    }

    //todo allow multiple listeners per key..
    on(key:string, update:(o:any) =>any, del:() =>any):void {

        if (update) {
            this.updateMap[key] = update;
        }

        if (del) {
            this.deleteMap[key] = del;
        }
    }


    onValue(create:(key:string, val:any) => any, update:(key:string, val:any)=>any, del:(key:string) => any) {

        if (create) {
            this.addListeners.push(create);
        }

        if (update) {
            this.updateListeners.push(update);
        }

        if (del) {
            this.delListeners.push(del);
        }
    }

    onWireChannelDataCreate(msg:wire.WireChannelDataCreate):void {
        var payload:string = msg.payload.getBytesAsUTF8();
        var o:any = JSON.parse(payload);
        this.elementMap[msg.key] = o;

        var update = this.updateMap[msg.key];

        if (update) {
            update(o);
        }

        this.addListeners.forEach(function (callback:any) {
            callback(msg.key, o);
        });
    }

    onWireChannelDataUpdate(msg:wire.WireChannelDataUpdate):void {
        var payload:string = msg.payload.getBytesAsUTF8();
        var o:any = JSON.parse(payload);
        this.elementMap[msg.key] = o;

        var update = this.updateMap[msg.key];

        if (update) {
            update(o);
        }

        this.updateListeners.forEach(function (callback:any) {
            callback(msg.key, o);
        });

    }

    onWireChannelDataDelete(msg:wire.WireChannelDataDelete):void {
        delete this.elementMap[msg.key];
        var del = this.deleteMap[msg.key];

        if (del) {
            del();
        }

        delete this.deleteMap[msg.key];


        this.delListeners.forEach(function (callback:any) {
            callback(msg.key);
        });

    }
}


export class AbstractBigBangClient implements wire.WireProtocolProtocolListener, BigBangClient {

    wireProtocol;
    _internalConnectionResult;
    _disconnectCallback;
    _clientId:string;
    _clientKey:string;


    channelSubscribeMap:{ [channeId:string]: (err:ChannelError, channel:Channel) =>any
    };

    channelMap:{ [channelId:string]: Channel
    }


    bufString:string = "";

    public channelListeners:{ [s:string]: (channel:string, payload:string) =>any;
    } = {};
    public sessionListener:(payload:string) => any;

    constructor() {
        this.wireProtocol = new wire.WireProtocol();
        this.wireProtocol.listener = this;
        this.connect = this.connect.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.channelSubscribeMap = {};
        this.channelMap = {};

    }


    connect(host:string, user:string, password:string, callback:(connectionResult:ConnectionResult) =>any):void {
        throw new Error("abstract");
    }

    connectAnonymous(host:string, callback:(connectionResult:ConnectionResult) =>any):void {
        throw new Error("abstract");
    }


    sendToServer(msg:pew.PewMessage):void {
        throw new Error("abstract");
    }

    subscribe(channelId:string, callback:(err:ChannelError, channel:Channel) =>any):void {
        this.channelSubscribeMap[channelId] = callback;
        var msg:wire.WireChannelSubscribe = new wire.WireChannelSubscribe();
        msg.name = channelId;
        this.sendToServer(msg);
    }

    unsubscribe(channelName:string):void {
        throw new Error("Not implemented");
    }

    getChannel(channelName:string):Channel {
        return this.channelMap[channelName];
    }

    onConnect():void {
        var req:wire.WireConnectRequest = new wire.WireConnectRequest();
        req.clientKey = this._clientKey;
        req.version = 1234;
        this.sendToServer(req);
    }

    onDisconnect(notify) {
        throw new Error("abstract");
    }


    disconnect():void {
        this.sendToServer(new wire.WireDisconnectRequest());
    }

    disconnected(callback:() =>any):void {
        this._disconnectCallback = callback;
    }

    publish(channel:string, payload:string):void {
        var msg:wire.WireChannelMessage = new wire.WireChannelMessage();
        msg.name = channel;
        msg.payload = new pew.ByteArray(pew.base64_encode(payload));
        this.sendToServer(msg);
    }

    clientId():string {
        return this._clientId;
    }

    onReceiveText(data:string):void {
        //tack it on, yo
        this.bufString += data;
        while (this.parseTextStream()) {
            //perhaps not the most elegant..
        }
    }

    parseTextStream():boolean {

        var delimIdx:number = this.bufString.indexOf(":");

        if (delimIdx != -1) {
            var lenStr:string = this.bufString.substr(0, delimIdx);
            var msgLen:number = parseInt(lenStr);

            //Save the earth, recycle.
            if (this.bufString.length < msgLen + 1 + delimIdx) {
                //just give up, leave the bufString alone for now..
                return false;
            }
            else {
                var body:string = this.bufString.substr(delimIdx + 1, msgLen + 1);

                var c:string = body.charAt(body.length - 1);
                if (c != ',') {
                    //need to explode and kill the client or something here..
                    console.error("TextProtocol decode exception, not terminated with comma");
                }

                var actualBody:string = body.substr(0, body.length - 1);

                //we actually have a message! Wheeee!
                this.wireProtocol.dispatchNetstring(actualBody);

                //pack up the leftovers.
                if (this.bufString.length > msgLen + 1 + delimIdx + 1) {
                    var left:string = this.bufString.substr(msgLen + 1 + delimIdx + 1);
                    this.bufString = left;
                    return true;
                }
                //we are done
                else {
                    this.bufString = "";
                    return false;
                }
            }
        }
        else {
            return false;
        }
    }


    onWireChannelJoin(msg:wire.WireChannelJoin) {
        var callback = this.channelSubscribeMap[msg.name];

        var channel:Channel = new Channel(this);
        channel.name = msg.name;
        channel.setChannelPermissions(msg.channelPermissions);

        this.channelMap[channel.name] = channel;

        if (!msg.success) {
            throw new Error("Unable to join channel, redirect this error please");
        }

        if (callback) {
            callback(null, channel);
        }
    }

    onWireChannelLeave(msg:wire.WireChannelLeave) {
        delete this.channelListeners[msg.name];
    }

    onWireChannelMessage(msg:wire.WireChannelMessage):void {
        var channel:Channel = this.channelMap[msg.name];
        channel.onWireChannelMessage(msg);
    }

    onWireQueueMessage(msg:wire.WireQueueMessage):void {
        var channel:Channel = this.channelMap[msg.name];
        channel.onWireQueueMessage(msg);
    }


    onWireRpcMessage(msg:wire.WireRpcMessage):void {
        //TODO -- do
    }

    onWireConnectFailure(msg:wire.WireConnectFailure) {
        var cr = new ConnectionResult();
        cr.clientId = null;
        cr.success = false;
        cr.message = msg.failureMessage;
        this._internalConnectionResult(cr);
    }

    onWireConnectSuccess(msg:wire.WireConnectSuccess):void {
        this._clientId = msg.clientId;
        var cr = new ConnectionResult();
        cr.clientId = msg.clientId;
        cr.success = true;
        cr.message = null;
        this._internalConnectionResult(cr);
    }

    onWireChannelDataCreate(msg:wire.WireChannelDataCreate):void {
        var channel:Channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataCreate(msg);
    }

    onWireChannelDataUpdate(msg:wire.WireChannelDataUpdate):void {
        var channel:Channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataUpdate(msg);
    }

    onWireChannelDataDelete(msg:wire.WireChannelDataDelete) {
        var channel:Channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataDelete(msg);
    }

    onWireChannelDataDel(msg:wire.WireChannelDataDel) {
        console.log('implement me channeldatadel');
    }

    onWireChannelDataPut(msg:wire.WireChannelDataPut) {
        console.log('implement me channeledataput');
    }

    onWireDisconnectSuccess(msg:wire.WireDisconnectSuccess):void {
        this.onDisconnect(false);
        if (this._disconnectCallback) {
            this._disconnectCallback();
        }
    }

    onWireChannelUnSubscribe(msg:wire.WireChannelUnSubscribe):void {
        console.log("implement me unsubscrube");
    }


    onWireDisconnectRequest(msg:wire.WireDisconnectRequest) {
        //not implemented on client
    }


    onWireConnectRequest(msg:wire.WireConnectRequest) {
        //not implemented on client
    }

    onWireChannelSubscribe(msg:wire.WireChannelSubscribe) {
        console.log('implement me onchannelsubs');
    }
}






