"use strict";

describe('unitTests', () => {
    describe('#parseAppURL', () => {
        it('provides a sane default for http', (done)=> {
            var bb = new BigBang.Client('http://www.asdfakljawefasdf.bigbang.io');
            const parsed = bb.parseAppURL();
            assert(parsed);
            assert(parsed.port);
            assert.equal(80, parsed.port);
            done();
        })

        it('provides a sane default for https', (done)=> {
            var bb = new BigBang.Client('https://www.asdfakljawefasdf.bigbang.io');
            const parsed = bb.parseAppURL();
            assert(parsed);
            assert(parsed.port);
            assert.equal(443, parsed.port);
            done();
        })

        it('Allows http override', (done)=> {
            var bb = new BigBang.Client('http://www.asdfakljawefasdf.bigbang.io:1234');
            const parsed = bb.parseAppURL();
            assert(parsed);
            assert(parsed.port);
            assert.equal(1234, parsed.port);
            done();
        })

        it('Allows https override', (done)=> {
            var bb = new BigBang.Client('https://www.asdfakljawefasdf.bigbang.io:1234');
            const parsed = bb.parseAppURL();
            assert(parsed);
            assert(parsed.port);
            assert.equal(1234, parsed.port);
            done();
        })

    })
});
