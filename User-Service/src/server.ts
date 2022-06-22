import { ApolloServer } from 'apollo-server'
import { buildSubgraphSchema } from '@apollo/subgraph';
import { resolvers, typeDefs } from './schema'
import { createContext } from './context'

new ApolloServer({ 
  schema: buildSubgraphSchema({ typeDefs, resolvers }), 
  context: createContext 
}).listen(
  { port: 4001 },
  () =>
    console.log(`🚀 User-Service ready at: http://localhost:4001`),
)