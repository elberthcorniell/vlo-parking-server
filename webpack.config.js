module.exports = {
    entry: {
        'bundle': './src/app/index.js'
    },
    output: {
        path: __dirname+'/src/public',
        filename: '[name].js'
    },/*
    entry: './src/app/index.js',
    output: {
        path: __dirname + '/src/public',
        filename: 'bundle.js'
    }, */
    module: {
        rules:[
            {
                use: 'babel-loader',
                test: /\.js$/,
                exclude: /node_modules/
            }
        ]
    }
}