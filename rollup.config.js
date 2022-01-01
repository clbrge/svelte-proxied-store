//import dts from "rollup-plugin-dts"

export default [
  {
    input: "./src/store.js",
    output: [
      { file: "dist/store.es.js", format: "es" },
      { file: "dist/store.umd.js", format: "umd", name: "svelte-proxied-store" },
    ]
  },
  // {
  //   input: "./src/store.d.ts",
  //   output: [{ file: "dist/store.d.ts", format: "es" }],
  //   plugins: [dts()],
  // },
]
