import { ApolloServer } from 'apollo-server'
import { buildSubgraphSchema } from '@apollo/subgraph';
import { resolvers, typeDefs } from './schema'
import { createContext } from './context'

new ApolloServer({ 
  schema: buildSubgraphSchema({ typeDefs, resolvers }), 
  context: createContext 
}).listen(
  { port: 4002 },
  () =>
    console.log(`🚀 Savings-Service ready at: http://localhost:4002`),
)