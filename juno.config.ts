import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      //   development: '<DEV_SATELLITE_ID>',
      development: "5yoof-ciaaa-aaaal-asevq-cai",
      //   production: "<PROD_SATELLITE_ID>",
      production: "uocd6-laaaa-aaaal-asfga-cai",
    },
    source: "out",
    predeploy: ["pnpm run build"],
  },
});
