# build-esm-project

a build command that will transform js/jsx/images/scss/less with gulp-babel/postcss/scss/less plugin.

## Installtion

```bash
  npm install --save-dev build-esm-project
  // or 
  yarn add -D build-esm-project
```

## Usage

support "build"、"start" command


"build" command:
```bash
## "build" command options:
##   --root <path>            provide project root directory, default process.cwd()
##   --build-config <path>    provide build esm config file path, default is process.cwd()/build-esm.config.js
##   --babel-config <path>    provide babel config file path, default is process.cwd()/babel.config.js
##   --postcss-config <path>  provide postcss config file path, default is process.cwd()/postcss.config.js
##   --ignore <path>          provide igonre transfrom files
##   --src <path>             source directory, default is src
##   --out <path>             output directory, default is esm
##    -ts, --typescript,      is typescript project

build-esm build
```
"start" command:
```bash
## "start" command options:
##   --root <path>            provide project root directory, default process.cwd()
##   --build-config <path>    provide build esm config file path, default is process.cwd()/build-esm.config.js
##   --babel-config <path>    provide babel config file path, default is process.cwd()/babel.config.js
##   --postcss-config <path>  provide postcss config file path, default is process.cwd()/postcss.config.js
##   --ignore <path>          provide igonre transfrom files
##   --src <path>             source directory, default is src
##   --out <path>             output directory, default is esm
##    -ts, --typescript,      is typescript project

build-esm start
```

you also can config the `build-esm.config.js` to custom do something:
```js
// build-esm.config.js: 
module.exports = {
  cleanEsm() {
    // return false will skip
  },
  buildJs(babelConfig, done, file) {
    // return false will skip
  },
  buildLess(lessConfig, done, file) {
    // return false will skip
  },
  buildScss(scssConfig, done, file) {
    // return false will skip
  },
  buildPostcss(postcssPlugins) {
    // return false will skip
  },
  buildOthers(done, file) {
    // return false will skip
  },
}
```


