const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    getCachePages(pageSize: Int, page: Int, urlFilter: String, sortBy: String, sortDirection: String): [cache]
    createNewAccount(email: String, password: String): createAccountResponse
  }

  type cache {
    key: String
    expirationTime: String
    createdAt: String
    status: Int
  }

  type createAccountResponse {
    response: Boolean
    message: String
  }
`;

module.exports={ typeDefs }
