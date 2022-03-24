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

esm-project start
```

you also can config the `esm-project.config.js` to custom do something:
```js
// esm-project.config.js: 
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
  buildOthers(othersConfig, done, file) {
    // return false will skip
  },
}
```


