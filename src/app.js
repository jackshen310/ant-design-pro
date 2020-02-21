// https://umijs.org/zh/guide/runtime-config.html#%E9%85%8D%E7%BD%AE%E6%96%B9%E5%BC%8F
export function patchRoutes(routes) {
  // 处理routes，在iframe模式下，删除BasicLayout这个路由
  if (window.g_isInIframe) {
    const pageRoutes = routes[0].routes[1].routes;
    // 删除路径 / 默认路由到/dashboard/analysis的配置
    pageRoutes.splice(pageRoutes.length - 3, 1);
    routes[0].routes = [routes[0].routes[0], ...pageRoutes];
  }
}
