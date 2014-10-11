var assert = require("assert");
var randomstring = require("randomstring");
var bigbang = require('../lib/NodeBigBangClient.js');


describe('client', function () {

    describe('#connect', function () {
        it('should connect successfuly', function (done) {
            var bb = new bigbang.Client();
            bb.connect('http://demo.bigbang.io', function (err) {
                assert.equal(err, null);
                done();
            })
        })
    });

    describe('#connect', function () {
        it('should should fail gracefully', function (done) {
            var bb = new bigbang.Client();
            bb.connect('http://hugenondexistintdomainthingfoobar.bigbang.io', function (err) {
                assert(err);
                done();
            })
        })
    });

    describe('#connect', function () {
        it('should connect successfuly via https', function (done) {
            var bb = new bigbang.Client();
            bb.connect('https://demo.bigbang.io', function (err) {
                assert.equal(err, null);
                done();
            })
        })
    });

    describe('#connect', function () {
        it('should should subscribe', function (done) {
            var bb = new bigbang.Client();
            bb.connect('http://demo.bigbang.io', function (err) {
                assert.equal(err, null);

                var channelName = randomstring.generate(8);
                bb.subscribe(channelName, function (err, channel) {
                    assert(!err);
                    assert(channel);

                    var sent = {"foo": randomstring.generate(), "bar": randomstring.generate()};

                    channel.on('message', function (msg) {
                        var json = msg.payload.getBytesAsJSON();

                        assert(json);
                        assert.deepEqual(json, sent);
                        done();
                    });

                    channel.publish(sent);
                });

            })
        })
    });


    describe('#channelData', function () {
        it('should do awesome channelData stuff ', function (done) {

            clientOnChannel(randomstring.generate(), function (channel) {

                var ks = randomstring.generate();
                var thekey = randomstring.generate();
                var obj = {foo: randomstring.generate(), bar: randomstring.generate() };

                channel.getChannelData(ks).on('add', function (key, value) {
                    assert.equal(key, thekey);
                    assert.deepEqual(value, obj);
                });

                channel.getChannelData(ks).on('remove', function (key) {
                    assert.equal(key, thekey);
                    done();
                });

                channel.getChannelData(ks).put(thekey, obj);
                channel.getChannelData(ks).remove(thekey);

            });
        });
    })
});


function clientOnChannel(name, callback) {
    var bb = new bigbang.Client();
    bb.connect('http://demo.bigbang.io', function (err) {
        assert.equal(err, null);

        bb.subscribe(name, function (err, channel) {
            assert(!err);
            assert(channel);
            callback(channel);
        });

    });
}
