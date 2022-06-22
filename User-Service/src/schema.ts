import { gql, AuthenticationError } from 'apollo-server';
import { DateTimeResolver } from 'graphql-scalars';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { Context } from './context';

const APP_SECRET = "INFINA";
let BLACKLIST_TOKEN: Array<string> = []; //using for demo, product using redis

export const typeDefs = gql`
    type User @key(fields: "id") {
        id: ID!
        fullname: String!
        username: String!
        createdAt: DateTime!
        updatedAt: DateTime!
    }
    type Query {
        me: User
    }
    type Mutation {
        register(input: RegisterInput!): RegisterPayload
        login(input: LoginInput): LoginPayload
        logout: String
    }

    input RegisterInput {
        fullname: String!
        username: String!
        password: String!
    }

    input LoginInput {
        username: String!
        password: String!
    }

    type RegisterPayload {
        status: Int!
        message: String!
    }

    type LoginPayload {
        token: String!
        user: User!
    }

    scalar DateTime
`;

export const resolvers = {
    DateTime: DateTimeResolver,

    User: {
        __resolveReference: (reference: any, context: Context) => {
            return context.prisma.user.findUnique({
                where: {
                    id: Number(reference?.id)
                }
            })
        }
    },

    Query: {
        me: (root, args, context: Context) => {
            const user = JSON.parse(context.req?.headers?.user);
            const userId = user?.userId;
            
            if (!userId) throw new AuthenticationError('You must be logged in');
            return context.prisma.user.findUnique({
                where: {
                    id: Number(userId)
                }
            })
        },
    },

    Mutation: {
        register: async (root, args: { input: RegisterInput }, context: Context) => {
            const { fullname, username, password } = args.input;
            if (!fullname) return { status: 400, message: "fullname is required" }

            if (!username) return { status: 400, message: "username is required" }

            if (!password) return { status: 400, message: "password is required" }

            const createdUser = await context.prisma.user.create({
                data: {
                    fullname,
                    username,
                    password: await hash(password, 10)
                }
            });

            if (!createdUser) return  { status: 500, message: "Internal server error" }

            return { status: 200, message: "Register success" };
            
        },

        login: async (root, args: { input: LoginInput }, context: Context) => {
            const { username, password } = args.input;

            if (!username) throw new Error("username is required");

            if (!password) throw new Error("password is required" );

            const findUser = await context.prisma.user.findUnique({
                where: {
                    username
                }
            });

            if (!findUser) {
                throw new Error(`No user found for username: ${username}`)
            }
            const passwordValid = await compare(password, findUser.password)
            if (!passwordValid) {
                throw new Error('Invalid password')
            }
            const token = sign({ userId: findUser.id }, APP_SECRET);
            BLACKLIST_TOKEN.push(token);
            return {
                token,
                user: findUser,
            }
        },
        logout: async (root, args, context: Context) => {
            const user = JSON.parse(context.req?.headers?.user);
            const userId = user?.userId;
            if (!userId) throw new AuthenticationError('You must be logged in');

            const token = user?.token as string;

            BLACKLIST_TOKEN = BLACKLIST_TOKEN.filter(item => item !== token);

            return "Logout Success";
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