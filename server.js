const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const { loadFilesSync } = require('@graphql-tools/load-files');
require('dotenv').config();

// express server
const app = express();

// db
const db = async () => {
    try {
        const success = await mongoose.connect(process.env.DATABASE, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false 
        });
        console.log('DB Connected');
    } catch (error) {
        console.log('DB Connection Error', error);
    }
};

// executes database connection
db();

// typeDefs
const typeDefs = mergeTypeDefs(loadFilesSync(path.join(__dirname, './typeDefs')));
// resolvers
const resolvers = mergeResolvers(loadFilesSync(path.join(__dirname, './resolvers')));

//graphql server
const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
});

// vinculation apollo server with express framework
apolloServer.applyMiddleware({ app });