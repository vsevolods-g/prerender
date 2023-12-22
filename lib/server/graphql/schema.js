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
    getUser: UserResponse
    getAllUsers: UsersResponse
    getAllOrganizations: [Organization!]!
    getUniqueDomains: [String]
  }

  type UserResponse {
    success: Boolean!
    message: String
    user: User
  }

  type UsersResponse {
    success: Boolean!
    message: String
    users: [User]
  }

  type User {
    email: String!
    name: String
    image: String
    role: String
    organizationId: String
    organizationName: String
  }

  type Organization {
    id: ID!
    name: String!
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
    associateUserWithOrganization(
      userEmails: [String!]!
      organizationName: String!
    ): OrganizationResponse!
    removeUsersFromOrganization(
      userEmails: [String!]!
    ): OrganizationResponse!
    deleteCachedPage(url: String!): DeleteCacheResponse
    fetchAndCachePage(url: String!): PageContent
    reCachePage(url: String!): PageContent
    createOrganization(name: String!): OrganizationResponse!
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
    role: String
    organizationId: String
  }

  type OrganizationResponse {
    success: Boolean!
    message: String
  }

  type AssociationResponse {
    success: Boolean
    message: String
    organizationId: String
  }
`;

module.exports = { typeDefs };
