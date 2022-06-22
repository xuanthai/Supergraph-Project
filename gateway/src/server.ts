import { ApolloServer } from 'apollo-server';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { readFileSync } from 'fs';
import { verify } from 'jsonwebtoken';

const APP_SECRET = "INFINA";

const supergraphSdl = readFileSync('./supergraph.graphql').toString();

interface Token {
    userId: string
}

const gateway = new ApolloGateway({
    supergraphSdl,
    buildService({ name, url }) {
        return new RemoteGraphQLDataSource({
          url,
          willSendRequest({ request, context }) {
            request?.http?.headers.set(
              "user",
              JSON.stringify({ userId: context?.userId, token: context?.token })
            );
          }
        });
      }
});

const server = new ApolloServer({
  gateway,
  context: ({ req }) => {
    let token = req.get('Authorization') || null;
    let userId;
    if (token) {
      try {
        const verifiedToken = verify(token, APP_SECRET) as Token
        userId =  verifiedToken && Number(verifiedToken.userId) || null;
      } catch(err) {
        userId = null;
        token = null;
      }
    }
    return { userId, token };
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀 Gateway ready at ${url}`);
}).catch(err => {console.error(err)});