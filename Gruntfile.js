module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: ['dist/', 'lib/'],

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
                    {src: ['dist/node/*'], dest: '/', filter: 'isFile'} // includes files in path
                ]
            },
            web: {
                options: {
                    archive: 'dist/bigbang-web.dist.zip'
                },
                files: [
                    {src: ['dist/web/**'], dest: '/', filter: 'isFile'} // includes files in path
                ]
            }
        },
        typescript: {
            node: {
                src: ['src/BigBangClient.ts', 'src/NodeBigBangClient.ts', 'src/PewRuntime.ts', 'src/WireProtocol.Protocol.ts'],
                dest: 'lib/node',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'src',
                    sourceMap: false,
                    fullSourceMapPath: true,
                    declaration: false
                }
            },
            web: {
                src: ['src/BigBangClient.ts', 'src/BrowserBigBangClient.ts', 'src/PewRuntime.ts', 'src/WireProtocol.Protocol.ts'],
                dest: 'lib/browser',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    basePath: 'src',
                    sourceMap: false,
                    fullSourceMapPath: false,
                    declaration: false
                }
            }
        },
        browserify: {
            options: {
                bundleOptions: {
                    standalone: 'bigbang'
                }
            },
            'dist/browser/bigbang.js': ['lib/browser/BrowserBigBangClient.js']

        },
        copy: {
//            main: {
//                files: [
//                    {src: "README-SHELL.md", dest: "dist/"},
//                    {src: "lib", dest: "dist/node"},
//                    {src: "package.client.json", dest: "dist/node/package.json"},
//                    {cwd: "hello", src: "**", dest: "dist/web/", expand: true},
//                    {src: 'dist/bigbang.js', dest: 'dist/web/bigbang.js'}
//                ]
//            }
            node : {
                files: [
                    {cwd: 'lib/node', src: "**", dest: "dist/node", expand:true},
                    {src: "package.client.json", dest: "dist/node/package.json"}
                ]
            }
        },
        markdownpdf: {
            options: {

            },
            files: {
                src: "*.md",
                dest: "dist"
            }
        },
        exec: {
            pewGenerate: {
                command: 'pew -c client -l typescript -i ../bigbang-io/src/main/pew/WireProtocol.pew -o lib'
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

    grunt.registerTask('default', ['clean', 'typescript', 'browserify', 'copy', 'uglify', 'markdownpdf', 'compress']);
    grunt.registerTask('build', ['clean', 'typescript', 'browserify', 'copy']);
};
