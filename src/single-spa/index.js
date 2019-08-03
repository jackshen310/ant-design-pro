import '@tmp/polyfills';
// import history from '../pages/.umi/history';
import '../global.tsx';
import React from 'react';
import ReactDOM from 'react-dom';
import findRoute from '/Users/Jack/Work/Workspace/vscode/study/spa/microfrontends/ant-design-pro/node_modules/umi-build-dev/lib/findRoute.js';
import singleSpaReact from 'single-spa-react'; // 引入依赖

function isSingleSpa() {
  return process.env.SINGLE_SPA === true;
}
// 如果是spa，修改路由base路径
if (isSingleSpa()) {
  window.routerBase = '/app4/';
}
// runtime plugins
const plugins = require('umi/_runtimePlugin');
window.g_plugins = plugins;
plugins.init({
  validKeys: [
    'patchRoutes',
    'render',
    'rootContainer',
    'modifyRouteProps',
    'onRouteChange',
    'modifyInitialProps',
    'initialProps',
    'dva',
    'locale',
  ],
});
plugins.use(require('../../node_modules/umi-plugin-dva/lib/runtime'));

const app = require('@tmp/dva')._onCreate();
window.g_app = app;

// if (!process.env.SINGLE_SPA) {
// render
let clientRender = async () => {
  window.g_isBrowser = true;
  let props = {};
  // Both support SSR and CSR
  if (window.g_useSSR) {
    // 如果开启服务端渲染则客户端组件初始化 props 使用服务端注入的数据
    props = window.g_initialData;
  } else {
    const pathname = location.pathname;
    const activeRoute = findRoute(require('@tmp/router').routes, pathname);
    // 在客户端渲染前，执行 getInitialProps 方法
    // 拿到初始数据
    if (activeRoute && activeRoute.component && activeRoute.component.getInitialProps) {
      const initialProps = plugins.apply('modifyInitialProps', {
        initialValue: {},
      });
      props = activeRoute.component.getInitialProps
        ? await activeRoute.component.getInitialProps({
            route: activeRoute,
            isServer: false,
            ...initialProps,
          })
        : {};
    }
  }
  const rootContainer = plugins.apply('rootContainer', {
    initialValue: React.createElement(require('../pages/.umi/router').default, props),
  });
  ReactDOM[window.g_useSSR ? 'hydrate' : 'render'](rootContainer, document.getElementById('root'));
};
const render = plugins.compose(
  'render',
  { initialValue: clientRender },
);

const moduleBeforeRendererPromises = [];
// client render
if (__IS_BROWSER) {
  Promise.all(moduleBeforeRendererPromises)
    .then(() => {
      if (!isSingleSpa()) {
        render();
      }
    })
    .catch(err => {
      window.console && window.console.error(err);
    });
}

// export server render
let serverRender, ReactDOMServer;
if (!__IS_BROWSER) {
  serverRender = async (ctx = {}) => {
    const pathname = ctx.req.url;
    require('@tmp/history').default.push(pathname);
    let props = {};
    const activeRoute = findRoute(require('../pages/.umi/router').routes, pathname) || false;
    if (activeRoute && activeRoute.component && activeRoute.component.getInitialProps) {
      const initialProps = plugins.apply('modifyInitialProps', {
        initialValue: {},
      });
      props = await activeRoute.component.getInitialProps({
        route: activeRoute,
        isServer: true,
        ...initialProps,
      });
      props = plugins.apply('initialProps', {
        initialValue: props,
      });
    } else {
      // message activeRoute or getInitialProps not found
      console.log(
        !activeRoute
          ? `${pathname} activeRoute not found`
          : `${pathname} activeRoute's getInitialProps function not found`,
      );
    }
    const rootContainer = plugins.apply('rootContainer', {
      initialValue: React.createElement(require('../pages/.umi/router').default, props),
    });
    const htmlTemplateMap = {};
    return {
      htmlElement: activeRoute && activeRoute.path ? htmlTemplateMap[activeRoute.path] : '',
      rootContainer,
      matchPath: activeRoute && activeRoute.path,
      g_initialData: props,
    };
  };
  // using project react-dom version
  // https://github.com/facebook/react/issues/13991
  ReactDOMServer = require('react-dom/server');
}

// export default __IS_BROWSER ? null : serverRender;

require('../global.less');

// hot module replacement
if (!process.env.SINGLE_SPA && __IS_BROWSER && module.hot) {
  module.hot.accept('../pages/.umi/router', () => {
    clientRender();
  });
}

/* ***************** single spa **************** */
const reactLifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: spa => {
    const rootContainer = plugins.apply('rootContainer', {
      initialValue: React.createElement(require('@tmp/router').default, {}),
    });
    return rootContainer;
  },
  domElementGetter,
});
function domElementGetter() {
  // Make sure there is a div for us to render into
  let el = document.getElementById('app4');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app4';
    document.querySelector('.ant-layout-content').appendChild(el);
  }

  return el;
}

export { ReactDOMServer };
export default process.env.SINGLE_SPA ? reactLifecycles : __IS_BROWSER ? null : serverRender;
