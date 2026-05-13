import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

//ДАННЫЕ 

const authors = [
  { id: '1', name: 'Лев Толстой', birthYear: 1828 },
  { id: '2', name: 'Фёдор Достоевский', birthYear: 1821 },
  { id: '3', name: 'Александр Пушкин', birthYear: 1799 },
];

const books = [
  { id: '1', title: 'Война и мир', year: 1869, authorId: '1' },
  { id: '2', title: 'Анна Каренина', year: 1877, authorId: '1' },
  { id: '3', title: 'Преступление и наказание', year: 1866, authorId: '2' },
  { id: '4', title: 'Идиот', year: 1868, authorId: '2' },
  { id: '5', title: 'Евгений Онегин', year: 1833, authorId: '3' },
];

//СХЕМА (typeDefs) 

const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    birthYear: Int!
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    year: Int!
    author: Author!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
    author(id: ID!): Author
  }

  type Mutation {
    createBook(title: String!, year: Int!, authorId: ID!): Book!
    createAuthor(name: String!, birthYear: Int!): Author!
  }
`;

//РЕЗОЛВЕРЫ

const resolvers = {
  // Корневые резолверы для Query
  Query: {
    books: () => books,
    book: (_, args) => books.find(book => book.id === args.id),
    authors: () => authors,
    author: (_, args) => authors.find(author => author.id === args.id),
  },

  // Резолверы для Mutation
  Mutation: {
    createBook: (_, args) => {
      const newBook = {
        id: String(books.length + 1),
        title: args.title,
        year: args.year,
        authorId: args.authorId,
      };
      books.push(newBook);
      return newBook;
    },
    createAuthor: (_, args) => {
      const newAuthor = {
        id: String(authors.length + 1),
        name: args.name,
        birthYear: args.birthYear,
      };
      authors.push(newAuthor);
      return newAuthor;
    },
  },

  // Резолверы для связи между типами
  Book: {
    author: (parent) => authors.find(author => author.id === parent.authorId),
  },

  Author: {
    books: (parent) => books.filter(book => book.authorId === parent.id),
  },
};


const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`GraphQL Server ready at: ${url}`);