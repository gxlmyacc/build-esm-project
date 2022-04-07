export interface CmdBuildOptions {
  root?: string,
  esmConfig?: string,
  babelConfig?: string,
  postcssConfig?: string,
  lessConfig?: string,
  scssConfig?: string,
  ignore?: string,
  src?: string,
  out?: string,
  typescript?: boolean,
  sourcemap?: boolean,
  [key: string]: any
}

export interface BuildOptions<T extends Record<string, any> = any> {
   root?: string,
   esmConfig?: string,
   babelConfig?: string,
   postcssConfig?: string,
   lessConfig?: string,
   scssConfig?: string,
   ignore?: string[],
   src?: string,
   out?: string,
   typescript?: boolean,
   sourcemap?: boolean,
   [key: string]: any,
   [key in T]: T[key]
}

export interface BabelConfig {
   presets?: Record<string, any>,
   plugins?: Record<string, any>,
   [key: string]: any
}


export interface GulpOptions {
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
  lessConfigFile: string,
  scssConfigFile: string,
  esmConfigFile: string,
  commandPrefx: string,
  sourcemap?: boolean,

  [key: string]: any
}

export interface GulpOptionsWithDone extends GulpOptions {
  done: (result?: any) => void,
  file: any
}

export interface EsmConfig<T extends Record<string, any> = any> {
  cleanEsm?: (buildConfig: BuildOptions<T>, options: GulpOptions) => void|false,
  buildJs?: (buildConfig: buildOptions<T>, babelConfig: BabelConfig, options: GulpOptionsWithDone) => void|false,
  buildPostcss?: (buildConfig: buildOptions<T>, postcssPlugins: Record<string, function>, options: GulpOptions) => void|false,
  buildLess?: (buildConfig: buildOptions<T>, lessConfig: Record<string, any>, options: GulpOptionsWithDone) => void|false,
  buildScss?: (buildConfig: buildOptions<T>, scssConfig: Record<string, any>, options: GulpOptionsWithDone) => void|false,
  buildCss?: (buildConfig: buildOptions<T>, cssConfig: { plugins: Record<string, function> }, options: GulpOptionsWithDone) => void|false,
  buildOthers?: (buildConfig: buildOptions<T>, othersConfig: Record<string, any>, options: GulpOptionsWithDone) => void|false
}

export type MergeEsmConfig = (...buildConfigs: EsmConfig[]) => { [key: string]: function[] }

export type ExecCommand = (name: string, options?: CmdBuildOptions) => void;

export type Start = (execCommand: ExecCommand, options: {
  command?: (commandName: string, command: any, options: {
    commandList: Record<string, string>,
    notifier: any,
    pkg: Record<string, any>
  }) => void|false
}) => void;
