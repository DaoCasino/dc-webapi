import pkg from './package.json'
import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import buble from 'rollup-plugin-buble'
import sourceMaps from 'rollup-plugin-sourcemaps'

const plugins = [
  json(),
  babel(),
  resolve(),
  commonjs(),
  buble({ exclude: ['node_modules/**'] }),
]

export default [
  {
		entry: 'lib/index.js',
		dest: pkg.browser,
		format: 'umd',
		moduleName: 'dcwebapi',
		plugins: [
      ...plugins,
      uglify()
		]
  },
  {
		input: 'lib/index.js',
		external: ['ms'],
		output: [
			{ file: pkg.mainBundle, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
    ],
    plugins: plugins
	}
]