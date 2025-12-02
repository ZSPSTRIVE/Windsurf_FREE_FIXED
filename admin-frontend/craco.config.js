module.exports = {
  devServer: {
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
};
