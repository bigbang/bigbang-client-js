module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: ['dist/'],

        uglify: {
            my_target: {
                files: {
                    'dist/bigbang.min.js': ['dist/bigbang.js']
                }
            }
        },
        compress: {
            node: {
                options: {
                    archive: 'dist/bigbang-node.dist.zip'
                },
                files: [
                    {src: ['dist/node/*'], dest: '/', filter: 'isFile'}, // includes files in path
                ]
            },
            web: {
                options: {
                    archive: 'dist/bigbang-web.dist.zip'
                },
                files: [
                    {src: ['dist/web/**'], dest: '/', filter: 'isFile'}, // includes files in path
                ]
            }
        },
        typescript: {
            node: {
                src: ['lib/BigBangClient.ts', 'lib/NodeBigBangClient.ts', 'lib/PewRuntime.ts', 'lib/WireProtocol.Protocol.ts', 'lib/NodeMain.ts', 'lib/BigBangShell.ts'],
                dest: 'dist/node',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'lib',
                    sourceMap: false,
                    fullSourceMapPath: true,
                    declaration: true
                }
            },
            web: {
                src: ['lib/BigBangClient.ts', 'lib/BrowserBigBangClient.ts', 'lib/PewRuntime.ts', 'lib/WireProtocol.Protocol.ts'],
                dest: 'dist/tmp/web',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'lib',
                    sourceMap: false,
                    fullSourceMapPath: false,
                    declaration: true
                }
            }
        },
        browserify: {
            options: {
                bundleOptions: {
                    standalone: 'bigbang'
                }
            },
            'dist/bigbang.js': ['dist/tmp/web/BrowserBigBangClient.js']

        },
        exec: {
            pewGenerate: {
                command: 'pew -c client -l typescript -i ../bigbang-io/src/main/pew/WireProtocol.pew -o lib'
            }
        },
        copy: {
            main: {
                files: [
                    {src: "README-SHELL.md", dest: "dist/"},
                    {src: "package.client.json", dest: "dist/node/package.json"},
                    {cwd: "hello", src: "**", dest: "dist/web/", expand: true},
                    {src: 'dist/bigbang.js', dest: 'dist/web/bigbang.js'}
                ]
            }
        },
        maven: {
            options: {
                goal: 'install',
                groupId: 'io.bigbang.client',
                artifactId: "bigbang-client-js",
                version: '1.0.0-beta1',
                injectDestFolder: false
            },
            src: ['dist/bigbang.js', 'dist/bigbang.min.js']
        },
        markdownpdf: {
            options: {

            },
            files: {
                src: "*.md",
                dest: "dist"
            }
        }
    });

    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-maven-tasks');
    grunt.loadNpmTasks('grunt-markdown-pdf');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('default', ['clean', 'exec', 'typescript', 'browserify', 'copy', 'uglify', 'markdownpdf', 'compress', 'maven']);
};
