Page({
  /**
   * 页面的初始数据
   */
  data: {
    accountAssets: '0.00', // 账户资产
    totalProfitLoss: 0,    // 当日总收益
    riseCount: 0,          // 上涨数量
    fallCount: 0,          // 下跌数量
    fundList: []           // 基金列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时请求数据
    this.fetchFundData();
  },

  /**
   * 下拉刷新触发
   */
  onPullDownRefresh() {
    this.fetchFundData(() => {
      wx.stopPullDownRefresh(); // 停止下拉刷新
    });
  },

  /**
   * 请求基金数据
   * @param {Function} callback 回调函数
   */
  fetchFundData(callback) {
    wx.showLoading({
      title: '加载中...',
    });

    // 调用HTTP接口获取数据（此处为示例接口地址，需替换为实际接口）
    wx.request({
      url: 'https://api.example.com/fund/account', // 替换为实际接口地址
      method: 'GET',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 0) {
          const data = res.data.data;
          // 更新页面数据
          this.setData({
            accountAssets: data.accountAssets.toFixed(2),
            totalProfitLoss: data.totalProfitLoss.toFixed(2),
            riseCount: data.riseCount,
            fallCount: data.fallCount,
            fundList: data.fundList.map(item => ({
              id: item.id,
              name: item.name,
              amount: item.amount.toFixed(2),
              profit: item.profit.toFixed(2),
              ratio: item.ratio.toFixed(2)
            }))
          });
        } else {
          wx.showToast({
            title: '数据加载失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
        callback && callback();
      }
    });
  }
});