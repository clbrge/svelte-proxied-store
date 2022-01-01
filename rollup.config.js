//import dts from "rollup-plugin-dts"

export default [
  {
    input: "./src/store.js",
    output: [
      { file: "dist/index.es.js", format: "es" },
      { file: "dist/index.umd.js", format: "umd", name: "svelte-proxied-store" },
    ]
  },
  // {
  //   input: "./src/store.d.ts",
  //   output: [{ file: "dist/store.d.ts", format: "es" }],
  //   plugins: [dts()],
  // },
]
