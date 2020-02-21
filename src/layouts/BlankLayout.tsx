import React from 'react';
import { onIframeReady } from '../iframe/event';

// 如果首次加载到这个模块，则说明应用已经加载完毕，可以调用onIframeReady方法
if (window.g_isInIframe) {
  onIframeReady();
}

const Layout: React.FC = ({ children }) => <>{children}</>;

export default Layout;
