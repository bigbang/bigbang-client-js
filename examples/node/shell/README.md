Big Bang Shell
==============

A console application which can be used to explore live data.

Installation
============

    npm install bigbang.io

Running
=======

    node BigBangShell http://demo.bigbang.io

Commands
========

Subscribe to a channel

    sub <channel>

Leave current channel

    unsub

Publish an event to current channel

    pub <json message>

Add key/value to default channel data

    put <key> <json value>

Delete key/value from channel data

    del <key>

View channel data

    ls


Examples
========

Subscribe to a channel

    http://demo.bigbang.io@>sub myChannel
    http://demo.bigbang.io@>Subscribed to myChannel
    http://demo.bigbang.io@myChannel>Subscriber af61e24b-5f59-4231-a44a-7a9a1a2ffdb4 joined channel myChannel
    http://demo.bigbang.io@myChannel>

Publish a message to the channel

    http://demo.bigbang.io@myChannel>pub {"big":"bang"}
    http://demo.bigbang.io@myChannel>channel[myChannel] senderId[af61e24b-5f59-4231-a44a-7a9a1a2ffdb4] {"big":"bang"}

Add some channel data. Syntax: put <key> <json value>

    http://demo.bigbang.io@myChannel>put foo {"some":"data"}
    key added => foo

Check out the channel data

    http://demo.bigbang.io@myChannel>ls
    foo=> {"some":"data"}

    subscribers: 257f4000-b4a9-4fb4-898a-3b88ee521e35

Delete the channel data.  Syntax: del <key>

    http://demo.bigbang.io@myChannel>del foo
    key removed => foo

Leave the channel

    http://demo.bigbang.io@myChannel>unsub
