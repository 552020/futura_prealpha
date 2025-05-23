import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      //   development: '<DEV_SATELLITE_ID>',
      development: "bkyz2-fmaaa-aaaaa-qaaaq-cai",
      //   production: "<PROD_SATELLITE_ID>",
      production: "uocd6-laaaa-aaaal-asfga-cai",
    },
    source: "out",
    predeploy: ["pnpm build"],
  },
});
