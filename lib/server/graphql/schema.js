const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    getCachePages(pageSize: Int, page: Int, urlFilter: String, filterCondition: String, urlDomain: String, sortBy: String, sortDirection: String): [cache]
    createNewAccount(email: String, password: String): createAccountResponse
    getTotalCachePagesCount: Int
  }

  extend type Query {
    getUniqueDomains: [String]
  }

  type Mutation {
    deleteCachedPage(url: String!): DeleteCacheResponse
  }

  type DeleteCacheResponse {
    success: Boolean
    message: String
  }

  type cache {
    key: String
    expirationTime: String
    createdAt: String
    status: Int
    content: String
  }

  type createAccountResponse {
    response: Boolean
    message: String
  }
`;

module.exports={ typeDefs }
