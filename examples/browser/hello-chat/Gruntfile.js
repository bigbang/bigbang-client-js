module.exports = function (grunt) {
    grunt.initConfig({
        'http-server': {
            'dev': {

                root: ".",
                port: 8080,
                host: "127.0.0.1",
                showDir: true,
                autoIndex: true,
                // server default file extension
                ext: "html",
                // run in parallel with other tasks
                runInBackground: false
            }
        }
    });
    grunt.loadNpmTasks('grunt-http-server');
    grunt.registerTask('default', ['http-server:dev']);
}
