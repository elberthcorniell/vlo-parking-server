module.exports = {
    entry: {
        'bundle': './src/app/index.js',
        'office': './src/app/office.js'
    },
    output: {
        path: __dirname+'/src/public',
        filename: '[name].js'
    },
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