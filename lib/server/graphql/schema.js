const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    getCachePages(pageSize: Int, page: Int, domain: String): [cache]
  }

  type cache {
    key: String
    expirationTime: String
    createdAt: String
    status: Int
  }
`;

module.exports={ typeDefs }
