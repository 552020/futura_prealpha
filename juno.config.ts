import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      //   development: '<DEV_SATELLITE_ID>',
      development: "5yoof-ciaaa-aaaal-asevq-cai",
      //   production: "<PROD_SATELLITE_ID>",
      production: "5yoof-ciaaa-aaaal-asevq-cai",
    },
    source: "out",
    predeploy: ["pnpm run build"],
  },
});
