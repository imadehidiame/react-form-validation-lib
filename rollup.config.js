import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import tailwindcss from '@tailwindcss/postcss';
import babel from '@rollup/plugin-babel';

const ignoreUseClient = () => ({
    name: 'ignore-use-client',
    transform(code) {
      if (code.startsWith("'use client'") || code.startsWith('"use client"')) {
        return { code: code.replace(/['"]use client['"];\n?/, ''), map: null };
      }
      return null;
    },
  });

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    ignoreUseClient(),
    resolve(),
    commonjs(),
    typescript(),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      plugins: ['babel-plugin-react-compiler'],
      exclude: 'node_modules/**',
    }),
    postcss({
     config: {
       path: './postcss.config.js',
      },
      plugins: [tailwindcss({ config: './tailwind.config.js' })],
      extract: 'styles.css',
      minimize: true,
      sourceMap:true,
      include: ['src/**/*.css'],
    }),
    terser(),
  ],
  external: ['react', 'react-dom', 'react-hook-form', 'zod'],
};