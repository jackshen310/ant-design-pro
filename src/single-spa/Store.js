import config from '../../config/config';
// 消息总线
class Store {
  appName = 'app-4';
  appPath = '/app4';
  getAppMenuInfo = () => {
    // 从路由信息中提取菜单信息
    let routes = config.routes;
    let menus = [];
    function getChildren(childRoutes) {
      let children = [];
      childRoutes.forEach(item => {
        if (item.name) {
          let menu = {
            name: item.name,
            path: '/app4' + item.path,
          };
          if (item.routes) {
            menu.children = getChildren(item.routes);
          }
          children.push(menu);
        }
      });
      return children;
    }
    routes.forEach(item => {
      if (item.path === '/') {
        menus = getChildren(item.routes);
      }
    });
    let promise = new Promise(resolve => {
      resolve(menus);
    });
    return promise;
  };
}

export default Store;
