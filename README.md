# esm-project-project

a build command that will transform js/jsx/images/scss/less with gulp-babel/postcss/scss/less plugin.

## Installtion

```bash
  npm install --save-dev esm-project-project
  // or 
  yarn add -D esm-project-project
```

## Usage

support "build"、"start" command

"build" command:
```bash
## "build" command options:
##   --root <path>            provide project root directory, default process.cwd()
##   --build-config <path>    provide build esm config file path, default is process.cwd()/esm-project.config.js
##   --babel-config <path>    provide babel config file path, default is process.cwd()/babel.config.js
##   --postcss-config <path>  provide postcss config file path, default is process.cwd()/postcss.config.js
##   --ignore <path>          provide igonre transfrom files
##   --src <path>             source directory, default is src
##   --out <path>             output directory, default is esm
##    -ts, --typescript,      is typescript project
##    --sourcemap             generate scripts`s sourcemap

esm-project build
```
"start" command:
```bash
## "start" command options:
##   --root <path>            provide project root directory, default process.cwd()
##   --build-config <path>    provide build esm config file path, default is process.cwd()/esm-project.config.js
##   --babel-config <path>    provide babel config file path, default is process.cwd()/babel.config.js
##   --postcss-config <path>  provide postcss config file path, default is process.cwd()/postcss.config.js
##   --ignore <path>          provide igonre transfrom files
##   --src <path>             source directory, default is src
##   --out <path>             output directory, default is esm
##    -ts, --typescript,      is typescript project
##    --sourcemap             generate scripts`s sourcemap

esm-project start
```

you also can config the `esm-project.config.js` to custom do something:
```js
// esm-project.config.js: 
module.exports = {
  cleanEsm(buildOptions, options) {
    // return false will skip
  },
  buildJs(buildOptions, babelConfig, options) {
    // return false will skip
  },
  buildPostcss(buildOptions, postcssPlugins, options) {
    // return false will skip
  },
  buildLess(buildOptions, lessConfig, options) {
    // return false will skip
  },
  buildScss(buildOptions, scssConfig, options) {
    // return false will skip
  },
  buildCss(buildOptions, cssConfig, options) {
    // return false will skip
  },
  buildOthers(buildOptions, othersConfig, options) {
    // return false will skip
  },
}
```

`esm-project.config.js`中的参数定义如下：
```ts
interface BuildOptions {
   root?: string,
   esmConfig?: string,
   babelConfig?: string,
   postcssConfig?: string,
   ignore?: string[],
   src?: string,
   out?: string,
   typescript?: boolean,
   sourcemap?: boolean,
   [key: string]: any
}

interface BabelConfig {
   presets?: Record<string, any>,
   plugins?: Record<string, any>,
   [key: string]: any
}


interface GulpOptions {
  rootDir: string,
  distDir: string,
  srcDir: string,
  jsMask: string,
  cssMask: string,
  scssMask: string,
  lessMask: string,
  otherMask: string,
  ignore: string[],
  babelConfigFile: string,
  postcssConfigFile: string,
  esmConfigFile: string,
  commandPrefx: string,
  sourcemap?: boolean,

  [key: string]: any
}

interface GulpOptionsWithDone extends GulpOptions {
  done: (result?: any) => void,
  file: any
}

interface EsmConfig {
  cleanEsm?: (buildConfig: BuildOptions, options: GulpOptions) => void|false,
  buildJs?: (buildConfig: buildOptions, babelConfig: BabelConfig, options: GulpOptionsWithDone) => void|false,
  buildPostcss?: (buildConfig: buildOptions, postcssPlugins: Record<string, function>, options: GulpOptions) => void|false,
  buildLess?: (buildConfig: buildOptions, lessConfig: Record<string, any>, options: GulpOptionsWithDone) => void|false,
  buildScss?: (buildConfig: buildOptions, scssConfig: Record<string, any>, options: GulpOptionsWithDone) => void|false,
  buildCss?: (buildConfig: buildOptions, cssConfig: { plugins: Record<string, function> }, options: GulpOptionsWithDone) => void|false,
  buildOthers?: (buildConfig: buildOptions, othersConfig: Record<string, any>, options: GulpOptionsWithDone) => void|false
}

```


