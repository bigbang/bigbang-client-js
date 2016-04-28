var webpack = require('webpack');

module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['lib/', 'web/'],

        watch: {
            react: {
                files: ['src/**/*.ts'],
                tasks: ['default']
            }
        },

        babel: {
            node: {
                options: {
                    sourceMap: true,
                    presets: ['babel-preset-node5'],
                },
                files: [
                    {src: 'src/BigBangClient.js', dest: 'lib/BigBangClient.js'},
                    {src: 'src/NodeBigBangClient.js', dest: 'lib/NodeBigBangClient.js'},
                    {src: 'src/PewRuntime.js', dest: 'lib/PewRuntime.js'},
                    {src: 'src/WireProtocol.Protocol.js', dest: 'lib/WireProtocol.Protocol.js'},
                    {expand:true, src:"**/*.js",  cwd:'src/rest', dest:'lib/rest'}
                ]
            },
            web: {
                options: {
                    sourceMap: true,
                    presets: ['babel-preset-es2015']
                },
                files: [
                    {src: 'src/BigBangClient.js', dest: 'web/BigBangClient.js'},
                    {src: 'src/BrowserBigBangClient.js', dest: 'web/BrowserBigBangClient.js'},
                    {src: 'src/PewRuntime.js', dest: 'web/PewRuntime.js'},
                    {src: 'src/WireProtocol.Protocol.js', dest: 'web/WireProtocol.Protocol.js'},
                    {expand:true, src:"**/*.js",  cwd:'src/rest', dest:'web/rest'}
                ]
            }
        },

        webpack: {
            web: {
                // webpack options
                entry: "./web/BrowserBigBangClient.js",
                output: {
                    path: './web',
                    filename: 'bigbang.io.js',
                    sourceMapFilename: "[file].map",
                    library: "BigBang",
                    libraryTarget: 'var'
                },

                plugins: [
                    new webpack.DefinePlugin({ "global.GENTLY": false }),

                    /*new webpack.optimize.UglifyJsPlugin({
                        compress: {
                            warnings: false
                        }
                    })
                    */
                ],

                node: {
                    fs: 'empty'
                },

                stats: {
                    // Configure the console output
                    colors: true,
                    modules: true,
                    reasons: true
                },
                // stats: false disables the stats output

                storeStatsTo: "xyz", // writes the status to a variable named xyz
                // you may use it later in grunt i.e. <%= xyz.hash %>

                progress: false, // Don't show progress
                // Defaults to true

                failOnError: false, // don't report error to grunt if webpack find errors
                // Use this if webpack errors are tolerable and grunt should continue

                watch: false, // use webpacks watcher
                // You need to keep the grunt process alive

                keepalive: false, // don't finish the grunt task
                // Use this in combination with the watch option

                inline: true,  // embed the webpack-dev-server runtime into the bundle
                // Defaults to false

                hot: false, // adds the HotModuleReplacementPlugin and switch the server to hot mode
                // Use this in combination with the inline option

            }
        },
        exec: {
            pewGenerate: {
                command: 'pew -c client -l typescript -i ../pulsar/src/main/pew/WireProtocol.pew -o src'
            },
            swagger: {
                command: "java -jar './../pulsar.js/tools/swagger-codegen-cli.jar' generate -i './../pulsar.js/api/swagger/swagger.yaml' -l javascript -o build && cp -r build/src/ src/rest"
            }

        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-babel')
    grunt.loadNpmTasks('grunt-webpack');
    grunt.loadNpmTasks('grunt-exec');

    grunt.registerTask('default', ['clean', 'babel', 'webpack']);
};
