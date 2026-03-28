Page({
  /**
   * 页面的初始数据
   */
  data: {
    userId: 'user001', // 当前用户ID（可从登录态获取）
    accountList: [ // 账户列表（最多4个）
      { accountId: 'acc001', name: '主账户', totalAmount: '0.00', totalProfit: 0 },
      { accountId: 'acc002', name: '理财账户', totalAmount: '0.00', totalProfit: 0 },
      { accountId: 'acc003', name: '备用账户', totalAmount: '0.00', totalProfit: 0 }
    ],
    currentAccountId: 'acc001', // 当前选中账户
    totalAccountAssets: '0.00', // 所有账户总金额
    totalAccountProfit: 0, // 所有账户总收益
    riseCount: 0, // 当前账户上涨基金数
    fallCount: 0, // 当前账户下跌基金数
    fundList: [] // 当前账户基金列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化加载所有账户数据
    this.loadAllAccountData();
  },

  /**
   * 下拉刷新触发
   */
  onPullDownRefresh() {
    this.loadAllAccountData(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 切换账户
   */
  switchAccount(e) {
    const accountId = e.currentTarget.dataset.accountid;
    this.setData({ currentAccountId: accountId }, () => {
      // 刷新当前账户的基金数据
      this.fetchAccountFundData(accountId);
    });
  },

  /**
   * 加载所有账户数据（汇总总金额/总收益）
   */
  loadAllAccountData(callback) {
    wx.showLoading({ title: '加载账户数据...' });
    // 遍历所有账户，逐个请求数据
    const accountList = this.data.accountList;
    const promiseList = accountList.map(account => {
      return new Promise((resolve) => {
        this.fetchAccountFundData(account.accountId, resolve);
      });
    });

    // 所有账户加载完成后汇总数据
    Promise.all(promiseList).then(() => {
      this.calcTotalAllAccountData();
      wx.hideLoading();
      callback && callback();
    });
  },

  /**
   * 请求单个账户的基金数据（带兜底）
   */
  fetchAccountFundData(accountId, resolve) {
    const { userId } = this.data;
    wx.request({
      url: 'https://api.example.com/fund/account',
      method: 'GET',
      data: { userId, accountId }, // 新增用户ID和账户ID参数
      header: { 'content-type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 0) {
          this.updateAccountData(accountId, res.data.data);
        } else {
          // 接口返回异常，使用模拟数据
          this.useMockData(accountId);
          wx.showToast({ title: '接口数据异常，加载本地数据', icon: 'none', duration: 1500 });
        }
        resolve && resolve();
      },
      fail: () => {
        // 网络失败，使用场景1差异化模拟数据
        this.useMockData(accountId);
        wx.showToast({ title: '网络失败，加载本地数据', icon: 'none', duration: 1500 });
        resolve && resolve();
      }
    });
  },

  /**
   * 更新单个账户的数据
   */
  updateAccountData(accountId, data) {
    const { accountList } = this.data;
    // 更新账户列表中的金额和收益
    const newAccountList = accountList.map(item => {
      if (item.accountId === accountId) {
        return {
          ...item,
          totalAmount: data.accountAssets.toFixed(2),
          totalProfit: data.totalProfitLoss.toFixed(2)
        };
      }
      return item;
    });

    // 如果是当前选中账户，更新基金列表和涨跌统计
    let riseCount = 0, fallCount = 0, fundList = [];
    if (accountId === this.data.currentAccountId) {
      fundList = data.fundList.map(item => ({
        id: item.id,
        name: item.name,
        amount: item.amount.toFixed(2),
        profit: item.profit.toFixed(2),
        ratio: item.ratio.toFixed(2)
      }));
      // 计算涨跌数量
      riseCount = fundList.filter(item => Number(item.profit) > 0).length;
      fallCount = fundList.filter(item => Number(item.profit) < 0).length;
    }

    this.setData({
      accountList: newAccountList,
      riseCount,
      fallCount,
      fundList
    });
  },

  /**
   * 场景1模拟数据（为不同账户生成差异化数据）
   */
  useMockData(accountId) {
    // 场景1基础数据，为不同账户调整数值（保证差异化）
    const mockDataMap = {
      acc001: { // 主账户
        accountAssets: 185623.89,
        totalProfitLoss: -1256.78,
        fundList: [
          { id: 1, name: '易方达沪深300ETF联接A', amount: 35890.23, profit: 89.56, ratio: 0.25 },
          { id: 2, name: '华夏新能源车ETF联接C', amount: 28765.12, profit: -156.89, ratio: -0.55 },
          { id: 3, name: '嘉实中证医疗ETF联接C', amount: 21560.78, profit: -210.34, ratio: -0.97 },
          { id: 4, name: '汇添富恒生科技ETF发起式联接Q', amount: 32100.45, profit: -320.67, ratio: -1.00 },
          { id: 5, name: '博时黄金ETF联接A', amount: 18900.67, profit: 45.23, ratio: 0.24 },
          { id: 6, name: '富国中证军工ETF联接A', amount: 15678.90, profit: 67.89, ratio: 0.43 },
          { id: 7, name: '中欧数字经济混合发起A', amount: 20150.34, profit: -189.76, ratio: -0.94 },
          { id: 8, name: '南方全球精选配置QDII', amount: 12890.56, profit: 32.10, ratio: 0.25 },
          { id: 9, name: '广发纳斯达克100ETF联接人民币(QDII)', amount: 19876.43, profit: 98.76, ratio: 0.50 },
          { id: 10, name: '华安创业板50ETF联接C', amount: 19710.35, profit: -245.68, ratio: -1.25 }
        ]
      },
      acc002: { // 理财账户（数值调整10%）
        accountAssets: 167061.50,
        totalProfitLoss: -1131.10,
        fundList: [
          { id: 11, name: '易方达消费行业股票', amount: 32301.21, profit: 80.60, ratio: 0.23 },
          { id: 12, name: '华夏沪深500ETF联接A', amount: 25888.61, profit: -141.20, ratio: -0.50 },
          { id: 13, name: '嘉实沪深300增强A', amount: 19404.70, profit: -189.31, ratio: -0.87 },
          { id: 14, name: '汇添富消费升级混合', amount: 28890.41, profit: -288.60, ratio: -0.90 },
          { id: 15, name: '博时标普500ETF联接A', amount: 17010.60, profit: 40.71, ratio: 0.22 }
        ]
      },
      acc003: { // 备用账户（数值调整15%）
        accountAssets: 157780.31,
        totalProfitLoss: -1068.26,
        fundList: [
          { id: 21, name: '富国天惠精选成长混合A', amount: 30506.69, profit: 76.13, ratio: 0.21 },
          { id: 22, name: '中欧医疗健康混合A', amount: 24450.35, profit: -133.36, ratio: -0.47 },
          { id: 23, name: '景顺长城新兴成长混合', amount: 18326.66, profit: -178.79, ratio: -0.82 },
          { id: 24, name: '易方达蓝筹精选混合', amount: 27285.38, profit: -272.57, ratio: -0.85 }
        ]
      }
    };

    // 获取当前账户的模拟数据，默认用主账户
    const mockData = mockDataMap[accountId] || mockDataMap.acc001;
    this.updateAccountData(accountId, mockData);
  },

  /**
   * 计算所有账户的总金额和总收益
   */
  calcTotalAllAccountData() {
    const { accountList } = this.data;
    let totalAssets = 0, totalProfit = 0;
    accountList.forEach(account => {
      totalAssets += Number(account.totalAmount);
      totalProfit += Number(account.totalProfit);
    });
    this.setData({
      totalAccountAssets: totalAssets.toFixed(2),
      totalAccountProfit: totalProfit.toFixed(2)
    });
  }
});