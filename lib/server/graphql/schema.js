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
    getCachePageContent(key: String!): PageContent
    getTotalCachePagesCount(
      urlFilter: String
      filterCondition: String
      urlDomain: String
    ): Int
    getUser: UserResponse
    getAllUsers: UsersResponse
    getAllOrganizations: [Organization!]!
    getUniqueDomains: [String]
    getDomainsForOrganizations: [String]
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

  enum Role {
    admin
    user
  }

  type User {
    email: String!
    name: String
    image: String
    role: Role
    organizationIds: [String]
    organizationNames: [String]
  }

  type Organization {
    id: ID!
    name: String!
    domains: [String]
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
      organizationNames: [String!]!
    ): OrganizationResponse!
    removeUsersFromOrganization(
      userEmails: [String!]!
      organizationNames: [String!]!
    ): OrganizationResponse!
    deleteCachedPage(url: String!): DeleteCacheResponse
    fetchAndCachePage(url: String!): PageContent
    reCachePage(url: String!): PageContent
    createOrganization(name: String!): OrganizationResponse!
    addDomainsToOrganizations(
      organizations: [OrganizationInput!]!
    ): OrganizationResponse!
  }

  input OrganizationInput {
    orgName: String!
    domains: [String!]!
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
    organizationIds: [String]
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
