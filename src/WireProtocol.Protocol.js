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
import * as pew from "./PewRuntime";
export class WireProtocol {
    constructor() {
        this.protocolId = 0;
        this.protocolHash = 'd96a44664eff8b2a710ded18e07ab927';
    }
    wrapNetstring(msg) {
        var msgStr = msg.messageType + ":" + msg.serializeJson();
        return pew.encodeNetstring(msgStr);
    }
    dispatchNetstring(s) {
        var idx = s.indexOf(":");
        var msgBody = s.substr(idx + 1);
        var t = parseInt(s.substr(0, idx));
        switch (t) {
            case 0:
                var WireChannelDataCreate_msg = new WireChannelDataCreate();
                WireChannelDataCreate_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataCreate(WireChannelDataCreate_msg);
                break;
            case 1:
                var WireChannelDataDel_msg = new WireChannelDataDel();
                WireChannelDataDel_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataDel(WireChannelDataDel_msg);
                break;
            case 2:
                var WireChannelDataDelete_msg = new WireChannelDataDelete();
                WireChannelDataDelete_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataDelete(WireChannelDataDelete_msg);
                break;
            case 3:
                var WireChannelDataPut_msg = new WireChannelDataPut();
                WireChannelDataPut_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataPut(WireChannelDataPut_msg);
                break;
            case 4:
                var WireChannelDataUpdate_msg = new WireChannelDataUpdate();
                WireChannelDataUpdate_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataUpdate(WireChannelDataUpdate_msg);
                break;
            case 5:
                var WireChannelJoin_msg = new WireChannelJoin();
                WireChannelJoin_msg.deserializeJson(msgBody);
                this.listener.onWireChannelJoin(WireChannelJoin_msg);
                break;
            case 6:
                var WireChannelLeave_msg = new WireChannelLeave();
                WireChannelLeave_msg.deserializeJson(msgBody);
                this.listener.onWireChannelLeave(WireChannelLeave_msg);
                break;
            case 7:
                var WireChannelMessage_msg = new WireChannelMessage();
                WireChannelMessage_msg.deserializeJson(msgBody);
                this.listener.onWireChannelMessage(WireChannelMessage_msg);
                break;
            case 8:
                var WireChannelSubscribe_msg = new WireChannelSubscribe();
                WireChannelSubscribe_msg.deserializeJson(msgBody);
                this.listener.onWireChannelSubscribe(WireChannelSubscribe_msg);
                break;
            case 9:
                var WireChannelUnSubscribe_msg = new WireChannelUnSubscribe();
                WireChannelUnSubscribe_msg.deserializeJson(msgBody);
                this.listener.onWireChannelUnSubscribe(WireChannelUnSubscribe_msg);
                break;
            case 10:
                var WireConnectFailure_msg = new WireConnectFailure();
                WireConnectFailure_msg.deserializeJson(msgBody);
                this.listener.onWireConnectFailure(WireConnectFailure_msg);
                break;
            case 11:
                var WireConnectRequest_msg = new WireConnectRequest();
                WireConnectRequest_msg.deserializeJson(msgBody);
                this.listener.onWireConnectRequest(WireConnectRequest_msg);
                break;
            case 12:
                var WireConnectSuccess_msg = new WireConnectSuccess();
                WireConnectSuccess_msg.deserializeJson(msgBody);
                this.listener.onWireConnectSuccess(WireConnectSuccess_msg);
                break;
            case 13:
                var WireDisconnectRequest_msg = new WireDisconnectRequest();
                WireDisconnectRequest_msg.deserializeJson(msgBody);
                this.listener.onWireDisconnectRequest(WireDisconnectRequest_msg);
                break;
            case 14:
                var WireDisconnectSuccess_msg = new WireDisconnectSuccess();
                WireDisconnectSuccess_msg.deserializeJson(msgBody);
                this.listener.onWireDisconnectSuccess(WireDisconnectSuccess_msg);
                break;
            case 15:
                var WirePing_msg = new WirePing();
                WirePing_msg.deserializeJson(msgBody);
                this.listener.onWirePing(WirePing_msg);
                break;
            case 16:
                var WirePong_msg = new WirePong();
                WirePong_msg.deserializeJson(msgBody);
                this.listener.onWirePong(WirePong_msg);
                break;
            case 17:
                var WireQueueMessage_msg = new WireQueueMessage();
                WireQueueMessage_msg.deserializeJson(msgBody);
                this.listener.onWireQueueMessage(WireQueueMessage_msg);
                break;
            case 18:
                var WireRpcMessage_msg = new WireRpcMessage();
                WireRpcMessage_msg.deserializeJson(msgBody);
                this.listener.onWireRpcMessage(WireRpcMessage_msg);
                break;
        }
    }
}
export class WireChannelDataCreate {
    constructor() {
        this.messageType = 0;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelDataCreate.key_IS_SET = 1 << 0;
WireChannelDataCreate.ks_IS_SET = 1 << 1;
WireChannelDataCreate.name_IS_SET = 1 << 2;
WireChannelDataCreate.payload_IS_SET = 1 << 3;
export class WireChannelDataDel {
    constructor() {
        this.messageType = 1;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelDataDel.key_IS_SET = 1 << 0;
WireChannelDataDel.ks_IS_SET = 1 << 1;
WireChannelDataDel.name_IS_SET = 1 << 2;
export class WireChannelDataDelete {
    constructor() {
        this.messageType = 2;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelDataDelete.key_IS_SET = 1 << 0;
WireChannelDataDelete.ks_IS_SET = 1 << 1;
WireChannelDataDelete.name_IS_SET = 1 << 2;
WireChannelDataDelete.payload_IS_SET = 1 << 3;
export class WireChannelDataPut {
    constructor() {
        this.messageType = 3;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelDataPut.key_IS_SET = 1 << 0;
WireChannelDataPut.ks_IS_SET = 1 << 1;
WireChannelDataPut.name_IS_SET = 1 << 2;
WireChannelDataPut.payload_IS_SET = 1 << 3;
export class WireChannelDataUpdate {
    constructor() {
        this.messageType = 4;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelDataUpdate.key_IS_SET = 1 << 0;
WireChannelDataUpdate.ks_IS_SET = 1 << 1;
WireChannelDataUpdate.name_IS_SET = 1 << 2;
WireChannelDataUpdate.payload_IS_SET = 1 << 3;
export class WireChannelJoin {
    constructor() {
        this.messageType = 5;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
        this.success = obj.success;
        this.channelPermissions = obj.channelPermissions;
        this.errorMessage = obj.errorMessage;
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelJoin.name_IS_SET = 1 << 0;
WireChannelJoin.success_IS_SET = 1 << 1;
WireChannelJoin.channelPermissions_IS_SET = 1 << 2;
WireChannelJoin.errorMessage_IS_SET = 1 << 3;
export class WireChannelLeave {
    constructor() {
        this.messageType = 6;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelLeave.name_IS_SET = 1 << 0;
export class WireChannelMessage {
    constructor() {
        this.messageType = 7;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.senderId = obj.senderId;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelMessage.senderId_IS_SET = 1 << 0;
WireChannelMessage.name_IS_SET = 1 << 1;
WireChannelMessage.payload_IS_SET = 1 << 2;
export class WireChannelSubscribe {
    constructor() {
        this.messageType = 8;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
        this.jsonConfig = obj.jsonConfig;
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelSubscribe.name_IS_SET = 1 << 0;
WireChannelSubscribe.jsonConfig_IS_SET = 1 << 1;
export class WireChannelUnSubscribe {
    constructor() {
        this.messageType = 9;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireChannelUnSubscribe.name_IS_SET = 1 << 0;
export class WireConnectFailure {
    constructor() {
        this.messageType = 10;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.failureMessage = obj.failureMessage;
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireConnectFailure.failureMessage_IS_SET = 1 << 0;
export class WireConnectRequest {
    constructor() {
        this.messageType = 11;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.version = obj.version;
        this.clientKey = obj.clientKey;
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireConnectRequest.version_IS_SET = 1 << 0;
WireConnectRequest.clientKey_IS_SET = 1 << 1;
export class WireConnectSuccess {
    constructor() {
        this.messageType = 12;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.clientId = obj.clientId;
        this.clientToServerPingMS = obj.clientToServerPingMS;
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireConnectSuccess.clientId_IS_SET = 1 << 0;
WireConnectSuccess.clientToServerPingMS_IS_SET = 1 << 1;
export class WireDisconnectRequest {
    constructor() {
        this.messageType = 13;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
export class WireDisconnectSuccess {
    constructor() {
        this.messageType = 14;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
export class WirePing {
    constructor() {
        this.messageType = 15;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
export class WirePong {
    constructor() {
        this.messageType = 16;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
export class WireQueueMessage {
    constructor() {
        this.messageType = 17;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.id = obj.id;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireQueueMessage.id_IS_SET = 1 << 0;
WireQueueMessage.name_IS_SET = 1 << 1;
WireQueueMessage.payload_IS_SET = 1 << 2;
export class WireRpcMessage {
    constructor() {
        this.messageType = 18;
    }
    serializeJson() {
        return JSON.stringify(this);
    }
    deserializeJson(json) {
        var obj = JSON.parse(json);
        this.id = obj.id;
        this.ns = obj.ns;
        this.payload = new pew.ByteArray(obj.payload);
    }
    setPewBitmask(flag) {
        this._pew_bitmask_ |= flag;
    }
    unsetPewBitmask(flag) {
        this._pew_bitmask_ &= flag;
    }
    pewBitmaskIsSetFor(flag) {
        return (this._pew_bitmask_ & flag) == flag;
    }
}
// Bitmask flags for optional field serialization support
WireRpcMessage.id_IS_SET = 1 << 0;
WireRpcMessage.ns_IS_SET = 1 << 1;
WireRpcMessage.payload_IS_SET = 1 << 2;
