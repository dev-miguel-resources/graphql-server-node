const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const http = require("http");
const path = require("path");
const mongoose = require("mongoose");
const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");
const { loadFilesSync } = require("@graphql-tools/load-files");
require("dotenv").config();
const { authCheckMiddleware } = require("./helpers/auth");
const cors = require("cors");
const cloudinary = require("cloudinary");

// express servers
const app = express();

// db
const db = async () => {
  try {
    const success = await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("DB Connected");
  } catch (error) {
    console.log("DB Connection Error", error);
  }
};

// executes database connection
db();

// middlewares
app.use(cors());
//app.use(bodyParser.json({ limit: "5mb"}))
app.use(express.json({ limit: "5mb" }));

// typeDefs
const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, "./typeDefs"))
);
// resolvers
const resolvers = mergeResolvers(
  loadFilesSync(path.join(__dirname, "./resolvers"))
);

//graphql server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res }),
});

// vinculation apollo server with express framework
apolloServer.applyMiddleware({ app });

// server
const httpserver = http.createServer(app);

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// rest endpoints
// example
app.get("/rest", authCheckMiddleware, function (req, res) {
  res.json({
    data: "you hit rest endpoint great!",
  });
});

// upload cloudinary
app.post("/uploadimages", authCheckMiddleware, (req, res) => {
  cloudinary.uploader.upload(
    req.body.image,
    (result) => {
      console.log(result);
      res.send({
        url: result.secure_url,
        public_id: result.public_id
      });
    },
    {
      public_id: `${Date.now()}`, // public name
      resource_type: "auto" // JPEG, PNG
    }
  )
  .then((callback) => callback());
});

// remove images cloudinary
app.post("/removeimage", authCheckMiddleware, (req, res) => {
  let image_id = req.body.public_id;

  cloudinary.uploader.destroy(image_id, (error, result) => {
    if (error) return res.json({ success: false, error});
    res.send("ok");
  })
});

// port
app.listen(process.env.PORT, function () {
  console.log(`server is ready at http://localhost:${process.env.PORT}`);
  console.log(
    `graphql server is ready at http://localhost:${process.env.PORT}${apolloServer.graphqlPath}`
  );
});
