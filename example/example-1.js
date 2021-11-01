import { DevApi } from ".";

const config = {
  resources: ["users", "dishes"],
  filepath: "./data/app.json",
  port: 3003,
};

const api = new DevApi(config);
api.listen(3003);
