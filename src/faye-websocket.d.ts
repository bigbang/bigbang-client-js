///<reference path="node.d.ts" />

/**
 * Stub of faye-websocket, enough to compile for our purposes.
 */
declare module "faye-websocket" {
    import events = require('events');


    function Client( host:string ): void;


    export class WebsocketClient extends events.EventEmitter {
        // Events
        on(event: string, listener: () => void);
    }
}