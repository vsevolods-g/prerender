const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    getCachePages(
      pageSize: Int
      page: Int
      urlFilter: String
      filterCondition: String
      urlDomain: String
      sortBy: String
      sortDirection: String
    ): [cache]
    getTotalCachePagesCount: Int
  }

  extend type Query {
    getUniqueDomains: [String]
  }

  input GoogleUserProfileInput {
    email: String!
    name: String
    image: String
  }

  type Mutation {
    authenticateWithGoogle(
      token: String!
      profile: GoogleUserProfileInput!
    ): AuthResponse
    deleteCachedPage(url: String!): DeleteCacheResponse
    fetchAndCachePage(url: String!): PageContent
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

  type PageContent {
    status: Int
    content: String
  }

  type AuthResponse {
    success: Boolean
    message: String
    token: String
  }
`;

module.exports = { typeDefs };
