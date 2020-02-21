/**
 * 子应用初始化完成后，如果有g_waitOpenPage参数，则打开该页面
 * 向主应用发送 iframeReady 信息，通知子应用已经加载完毕
 */
const onIframeReady = () => {
  console.log('iframeReady');
  if (window.g_waitOpenPage) {
    window.g_history.push(`/${window.g_waitOpenPage}`);
  }
  window.parent.postMessage(
    {
      appId: 'antd-pro',
      type: 'iframeReady',
    },
    '*',
  );
};

// 接收portal应用发送过来的消息，并进行处理
const onIframeMessage = () => {
  window.addEventListener('message', event => {
    try {
      const { type, page } = event.data;
      console.log('onMessage', event.data);
      switch (type) {
        case 'openPage':
          // 打开页面
          window.g_history.push(`/${page}`);
          break;
        case 'closePage':
          // 关闭页面，由于ant-design-pro 没有实现路由 keep-alive功能，所以关闭页面相当于路由到一个空白页面
          window.g_history.push('/');
          break;
        case 'reloadPage':
          // 刷新页面，由于ant-design-pro 没有实现路由 keep-alive功能，所以刷新页面相当于刷新整个iframe
          // 通过修改location.search可以达到location.reload()的效果，所以就没必要调用window.location.reload()方法
          window.location.search = window.g_search;
          break;
        default:
          return;
      }
    } catch (e) {}
  });
};

/**
 * 1. 保存搜索条件(location.search)，用于在刷新页面的时候，重新携带上
 * 2. 如果URL参数有isInIframe或者page参数，则说明是以子应用的方式嵌入的
 * 2.1 如果有isInIframe参数，则初始化事件监听程序，监听主应用的消息（postMessage）
 * 2.2 如果有page参数，则在页面初始化完成后打开对应的页面
 */
const onIframeInit = () => {
  const params = new URLSearchParams(window.location.search);
  // 保存搜索条件，用于在刷新页面的时候，重新携带上
  window.g_search = window.location.search;
  if (params.get('isInIframe')) {
    window.g_isInIframe = true;
    onIframeMessage();
  }
  if (params.get('page')) {
    window.g_isInIframe = true;
    window.g_waitOpenPage = params.get('page');
  }
};

export { onIframeReady, onIframeInit };
