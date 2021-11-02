import express from "express";
import cors from "cors";
import loki from "lokijs";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export class DevApi {
  constructor({ resources, filepath }) {
    this.initializeStorage(filepath);

    this.resources = resources;
    this.db = new loki(path.resolve(filepath), { persistenceMethod: "fs" });
    this.app = express();
    this.app.use(express.json());
    this.app.use(
      cors({
        origin: "*",
      })
    );
    this.collections = {};

    this.initializeDatabase();
    this.initializeRoutes();
  }

  initializeStorage(filepath) {
    this.filepath = path.resolve(filepath);

    try {
      if (!fs.existsSync(this.filepath)) {
        fs.mkdir(path.dirname(this.filepath), { recursive: true }, (err) => {
          if (err) throw new Error(err);

          fs.writeFileSync(this.filepath, "");
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  initializeDatabase() {
    this.db.loadDatabase({}, () => {
      this.resources.forEach((resource) => {
        let collection = this.db.getCollection(resource);

        if (!collection) {
          collection = this.db.addCollection(resource);
        }

        this.collections[resource] = collection;
      });
    });
  }

  initializeRoutes() {
    this.app.get("/", (req, res) => {
      res.send("Dev API");
    });

    this.resources.forEach((resource) => {
      this.app.get(`/${resource}`, (req, res) => {
        const collection = this.db.getCollection(resource).data;
        res.json({ data: collection });
      });

      this.app.get(`/${resource}/:resourceId`, (req, res) => {
        const collection = this.collections[resource];
        const item = collection.by("id", req.params.resourceId);
        res.json({ data: item });
      });

      this.app.post(`/${resource}`, (req, res) => {
        const requestData = req.body;
        if (!requestData.id) {
          requestData.id = uuidv4();
        }

        const collection = this.collections[resource];
        collection.insert(requestData);
        this.db.saveDatabase();
        res.json(requestData);
      });

      this.app.post(`/${resource}/:resourceId`, (req, res) => {
        const requestData = req.body;
        const collection = this.collections[resource];
        const item = {
          ...collection.by("id", req.params.resourceId),
          ...requestData,
        };
        collection.update(item);
        this.db.saveDatabase();
        res.json(item);
      });

      this.app.delete(`/${resource}/:resourceId`, (req, res) => {
        const id = req.params.resourceId;
        this.collections[resource].findAndRemove({ id: { $aeq: id } });
        this.db.saveDatabase();
        res.json({ data: id });
      });
    });
  }

  listen(port = 3000) {
    this.app.listen(port, () => {
      console.log(`Dev API listening at http://localhost:${port}`);
    });
  }
}
