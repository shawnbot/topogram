import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";


export default {
  entry: 'index.js',
  moduleName: 'd3',
  format: 'umd',
  globals: {
    'd3-geo': 'd3',
    'd3-array': 'd3'
  },
  dest: 'build/d3-cartogram.js',
  plugins: [
    nodeResolve({
        jsnext: true,
        main: true,
        browser: true,
        extensions: [".js", ".jsx"]
      }),
    commonjs({
      include: "node_modules/**",
      exclude: [ "node_modules/d3-geo/", "node_modules/d3-array/", "node_modules/buffer/", "node_modules/events/", "node_modules/util/"]

    })
  ]
};
