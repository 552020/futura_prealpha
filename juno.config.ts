import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      //   development: '<DEV_SATELLITE_ID>',
      development: "ak7hz-xyaaa-aaaal-asgqq-cai",
      //   production: "<PROD_SATELLITE_ID>",
      production: "ak7hz-xyaaa-aaaal-asgqq-cai",
    },
    source: "out",
    predeploy: ["npm run build"]
  },
});
