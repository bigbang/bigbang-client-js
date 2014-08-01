## Getting Started with Big Bang and Node.js


#### General notes

The BigBangShell is simple interactive shell built with the JavaScript client and  Node.js. It will give you a feel for the basics of Big Bang's streaming events and data synchronization.  Additionally it can be a handy tool for testing and debugging your applications.

If you dont have Node.js installed, go get it [here](http://nodejs.org/)

Using your shell or command prompt, switch into the node directory of the SDK distribution.  Use Node Package Manager to install all the required dependencies.

   	$ npm install

*In future releases, the Javascript SDK will be obtainable directly from npm*

Once this is complete you can run the Big Bang Shell.  You will need to supply the name of your application.

    $ node BigBangShell.js <yourapplication>.app.bigbang.io
    
If your application was named test ( it isn't, this is an example ) you would use the following

    $ node BigBangShell.js test.app.bigbang.io   
    
If you connect successfully you will see something like the following:

       
    $ node BigBangShell.js test.app.bigbang.io
    Connecting to host test.app.bigbang.io
    Connected!
    test.app.bigbang.io@>
    
You now have a live Big Bang shell, and can interact directly with your application and data.
    
    
#### Subscribing to channels.    
    
All realtime interaction in Big Bang happens in channels.  To subscribe to a channel using the shell try the following.  Substitute whatever channel name you like.

    test.app.bigbang.io@>subs <channelName>
   
   
You should see something like the following:

    test.app.bigbang.io@>subscribe: myChannel
    test.app.bigbang.io@myChannel> Subscriber 7ad93264-e8cb-4bc4-bbcb-72367ddc1f5c joined channel myChannel

Note that you have been notified of a subscriber joining the channel.  That subscriber is probably you!  You can easily check this.
   
    test.app.bigbang.io@>whoami
    You are 7ad93264-e8cb-4bc4-bbcb-72367ddc1f5c

Each Big Bang client is assigned a unique id.  

        
####Publishing events to a channel


You can publish to the channel with the publish command.  Just supply a JSON message.

    test.app.bigbang.io@myChannel> pub {"foo":"bar"}
    test.app.bigbang.io@myChannel> channel[myChannel] clientId[a8b71c58-e5d8-421e-8ae0-c96d01e071da] {"foo":"bar"}

You and any other subscribers will immediately receive any event that is published to the channel.  The default mode expects a properly
formatted JSON message.  You can use the 'mode' command to change to a mode which will attempt to parse your input in to key/value pairs and create a JSON
object automatically.  You will need to provide an even number of key/pair values.


    test.app.bigbang.io@myChannel> pub foo bar
    test.app.bigbang.io@myChannel> channel[myChannel] clientId[a8b71c58-e5d8-421e-8ae0-c96d01e071da] {"foo":"bar"}
    
You and any other subscribers will immediately receive any event that is published to the channel.    
    
    
#### Synchronizing data with ChannelData
    
    
Publish/Subscribe events are great for transient data, or for streams of data that tend to change very frequently.  This model presents challenges for clients that join the conversation late and need to catch up to the current state of the channel.  For this use ChannelData.  

Think of ChannelData as collections of key -> value pairs associated with a channel.  Every channel has a default ChannelData, and clients can create new named ChannelData collections on demand.
    
*Note: ChannelData and Keyspaces are the same concept and the names are used somewhat interchangably in the current SDK.  This will be simplified in a future release.*    
    
    
Put a key/value pair into channel data for the current channel.  Just like with events, the shell will marshall your key value pair arguments into a JSON object.  This is the format.

    test.app.bigbang.io@myChannel> put <key> <json message>


Just like with publishing events, the console will marshall the key -> value pairs into a JSON object.

	test.app.bigbang.io@myChannel> put foo {"bar":"baz"}
		
You can now verify the value has been placed into ChannelData with the 'ls' command.

    test.app.bigbang.io@myChannel> ls
    foo=> {"bar":"baz"}
	
	
To delete the value you just placed into ChannelData, simply delete the key.

    test.app.bigbang.io@myChannel> del foo

    
    

