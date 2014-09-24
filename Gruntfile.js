module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: ['lib/', 'web/'],

        typescript: {
            node: {
                src: ['src/BigBangClient.ts', 'src/NodeBigBangClient.ts', 'src/PewRuntime.ts', 'src/WireProtocol.Protocol.ts'],
                dest: 'lib',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'src'
                }
            },
            web: {
                src: ['src/BigBangClient.ts', 'src/BrowserBigBangClient.ts', 'src/PewRuntime.ts', 'src/WireProtocol.Protocol.ts'],
                dest: 'web',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'src'
                }
            }
        },
        browserify: {
            js: {
                src : 'web/BrowserBigBangClient.js',
                dest : 'web/bigbang.io.js',
                options : {
                    browserifyOptions : {
                        standalone : 'bigbang.io'
                    }
                }
            }
        },
        uglify: {
            my_target: {
                files: {
                    'web/bigbang.io.min.js': ['web/bigbang.io.js']
                }
            }
        },
        exec: {
            pewGenerate: {
                command: 'pew -c client -l typescript -i ../bigbang-io/src/main/pew/WireProtocol.pew -o lib'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-exec');

    grunt.registerTask('default', ['clean', 'typescript', 'browserify', 'uglify']);
};
