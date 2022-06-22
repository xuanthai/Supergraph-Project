import { gql, AuthenticationError } from 'apollo-server';
import { DateTimeResolver } from 'graphql-scalars';
import { Context } from './context';

const APP_SECRET = "INFINA";

export const typeDefs = gql`
    type Saving @key(fields: "id") {
        id: ID!
        banance: Float!
        user: User
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type User @key(fields: "id") {
        id: ID!
        saving: Saving
    }
    type Query {
        saving: Saving
    }

    type Mutation {
        deposit(amount: Float!): Saving
        withdraw(amount: Float!): Saving
    }

    scalar DateTime
`;

export const resolvers = {
    DateTime: DateTimeResolver,

    Saving: {
        __resolveReference: (reference: any, context: Context) => {
            return context.prisma.saving.findUnique({
                where: {
                    id: Number(reference?.id)
                }
            })
        }
    },

    User: {
        saving: (root, args, context: Context) => {
            return context.prisma.saving.findUnique({
                where: {
                    createdBy: Number(root.id)
                }
            })
        }
    },

    Query: {
        saving: (root, args, context: Context) => {
            const user = JSON.parse(context.req?.headers?.user);
            const userId = user?.userId;
            if (!userId) throw new AuthenticationError('You must be logged in');

            return context.prisma.saving.findUnique({
                where: {
                    createdBy: Number(userId)
                }
            })
        }
    },

    Mutation: {
        deposit: (root, args, context: Context) => {
            const user = JSON.parse(context.req?.headers?.user);
            const userId = user?.userId;
            if (!userId) throw new AuthenticationError('You must be logged in');

            const amount = Number(args.amount || 0);
            return context.prisma.saving.upsert({
                where: {
                    createdBy: Number(userId)
                },
                update: {
                    banance: {
                        increment: amount
                    }
                },
                create: {
                    createdBy: userId,
                    banance: amount
                }
            })
        },
        withdraw: (root, args, context: Context) => {
            const user = JSON.parse(context.req?.headers?.user);
            const userId = user?.userId;
            if (!userId) throw new AuthenticationError('You must be logged in');

            const amount = Number(args.amount || 0);

            return context.prisma.saving.upsert({
                where: {
                    createdBy: Number(userId)
                },
                update: {
                    banance: {
                        decrement: amount
                    }
                },
                create: {
                    createdBy: userId,
                    banance: amount
                }
            })
        },
    }
}

interface RegisterInput {
    fullname: string
    username: string
    password: string
}

interface LoginInput {
    username: string
    password: string
}