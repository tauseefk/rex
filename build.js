import esbuild from "esbuild";

const isDevelopment = process.env.NODE_ENV === "development";

esbuild
  .build({
    logLevel: "info",
    entryPoints: ["src/index.ts", "src/examples.ts"],
    bundle: true,
    minify: !isDevelopment,
    format: "esm",
    treeShaking: true,
    platform: "browser",
    target: "es2022",
    outdir: "./dist",
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
