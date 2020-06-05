const path = require('path');
const os = require('os');

function getNetworkIp() {
	let needHost = ''; // 打开的host
	try {
		// 获得网络接口列表
		let network = os.networkInterfaces();
		for (let dev in network) {
			let iface = network[dev];
			for (let i = 0; i < iface.length; i++) {
				let alias = iface[i];
				if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
					needHost = alias.address;
				}
			}
		}
	} catch (e) {
		needHost = 'localhost';
	}
	return needHost;
}
module.exports = {
  entry: {
    index: './src/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(htm|html|xlsx)$/,
        use: ['raw-loader'],
      },
    ],
  },
  devServer: {
    host: getNetworkIp(), //此配置为自己机子的ip 利于手机或者别人测试用1
    port: 8888,
    inline: true, // 可以监控js变化
    hot: true, // 热启动
    compress: true,
    watchContentBase: false,
  },
};
