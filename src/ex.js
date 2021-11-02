const DevApi = require("@justinkprince/dev-api");

const config = {
  resources: ["users", "groups", "books"],
  filepath: "./data/app.json",
  port: 3003,
};

const api = new DevApi(config);
api.listen(3003);
