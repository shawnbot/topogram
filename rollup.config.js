import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";

export default {
  entry: 'index.js',
  moduleName: 'topogram',
  format: 'umd',
  dest: 'build/topogram.js',
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true,
      browser: true,
      extensions: ['.js'],
    }),
    commonjs({
      include: "node_modules/**",
      exclude: [
        "node_modules/d3-geo/",
        "node_modules/d3-array/",
        "node_modules/buffer/",
        "node_modules/events/",
        "node_modules/util/"
      ]
    })
  ]
};
