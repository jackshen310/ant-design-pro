// Change theme plugin
// eslint-disable-next-line eslint-comments/abdeils - enable - pair;
/* eslint-disable import/no-extraneous-dependencies */
import ThemeColorReplacer from 'webpack-theme-color-replacer';
import generate from '@ant-design/colors/lib/generate';
import path from 'path';

function getModulePackageName(module: { context: string }) {
  if (!module.context) return null;

  const nodeModulesPath = path.join(__dirname, '../node_modules/');
  if (module.context.substring(0, nodeModulesPath.length) !== nodeModulesPath) {
    return null;
  }

  const moduleRelativePath = module.context.substring(nodeModulesPath.length);
  const [moduleDirName] = moduleRelativePath.split(path.sep);
  let packageName: string | null = moduleDirName;
  // handle tree shaking
  if (packageName && packageName.match('^_')) {
    // eslint-disable-next-line prefer-destructuring
    packageName = packageName.match(/^_(@?[^@]+)/)![1];
  }
  return packageName;
}

export default (config: any) => {
  // preview.pro.ant.design only do not use in your production;
  if (
    process.env.ANT_DESIGN_PRO_ONLY_DO_NOT_USE_IN_YOUR_PRODUCTION === 'site' ||
    process.env.NODE_ENV !== 'production'
  ) {
    config.plugin('webpack-theme-color-replacer').use(ThemeColorReplacer, [
      {
        fileName: 'css/theme-colors-[contenthash:8].css',
        matchColors: getAntdSerials('#1890ff'), // 主色系列
        // 改变样式选择器，解决样式覆盖问题
        changeSelector(selector: string): string {
          switch (selector) {
            case '.ant-calendar-today .ant-calendar-date':
              return ':not(.ant-calendar-selected-date)' + selector;
            case '.ant-btn:focus,.ant-btn:hover':
              return '.ant-btn:focus:not(.ant-btn-primary),.ant-btn:hover:not(.ant-btn-primary)';
            case '.ant-btn.active,.ant-btn:active':
              return '.ant-btn.active:not(.ant-btn-primary),.ant-btn:active:not(.ant-btn-primary)';
            default:
              return selector;
          }
        },
        // isJsUgly: true,
      },
    ]);
  }

  // optimize chunks
  config.optimization
    // share the same chunks across different modules
    .runtimeChunk(false)
    .splitChunks({
      chunks: 'async',
      name: 'vendors',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendors: {
          test: (module: { context: string }) => {
            const packageName = getModulePackageName(module);
            if (packageName) {
              return ['bizcharts', '@antv_data-set'].indexOf(packageName) >= 0;
            }
            return false;
          },
          name(module: { context: string }) {
            const packageName = getModulePackageName(module);
            if (packageName) {
              if (['bizcharts', '@antv_data-set'].indexOf(packageName) >= 0) {
                return 'viz'; // visualization package
              }
            }
            return 'misc';
          },
        },
      },
    });

  if (!process.env.SINGLE_SPA) {
    return;
  }
  // 如下为针对spa的特殊配置
  // 详细配置参考：https://github.com/neutrinojs/webpack-chain
  // 1. 增加store入口
  config
    .entry('store')
    .add('./src/single-spa/Store.js')
    .end();
  // 2. 修改umi入口
  config.entryPoints
    .get('umi')
    .clear()
    .end();
  config
    .entry('umi')
    .add('./src/single-spa/index.js')
    .end();

  // 3. 修改output的library和libraryTarget
  config.output
    .library('umi')
    .libraryTarget('amd')
    .filename('[name].js') // TODO 这里暂时不支持生成带有hash的文件名
    .publicPath('http://localhost:9095/') // TODO 这里暂时只能写死端口
    .end();
  // 4. 公共依赖抽取，因为在主项目中已经加载了
  config.externals({
    react: 'react',
    'react-dom': 'react-dom',
  });
};

const getAntdSerials = (color: string) => {
  const lightNum = 9;
  const devide10 = 10;
  // 淡化（即less的tint）
  const lightens = new Array(lightNum).fill(undefined).map((_, i: number) => {
    return ThemeColorReplacer.varyColor.lighten(color, i / devide10);
  });
  const colorPalettes = generate(color);
  return lightens.concat(colorPalettes);
};
