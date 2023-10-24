import { PrismaClient as PrismaClientTransaction } from '../config/prisma/generated/transactions/index.js';
const prismaTransaction = new PrismaClientTransaction();

export const getAllById = async (queryParams: any, userId: string | null) => {
  try {
    const {
      page = 1,
      size = 10,
      dateFrom,
      dateTo,
      type,
      gameId
      // search
    } = queryParams;

    const filter: any = {
      userId
    };

    if (dateFrom) {
      filter.createdAt = { gte: new Date(dateFrom) };
    }
    if (dateTo) {
      filter.createdAt = { ...filter.createdAt, lte: new Date(dateTo) };
    }
    if (type) {
      filter.type = { in: type.split(',') };
    }
    if (gameId) {
      filter.gameId = gameId;
    } 

    const transactions = await prismaTransaction.transactions.findMany({
      where: filter,
      skip: page * size,
      take: Number(size)
    });

    const count = await prismaTransaction.transactions.count({
      where: filter
    });

    return { transactions, count, page, size };
  } catch (error: any) {
    throw Error(error);
  }
};

export const create = async (data:any) => {
  try {
    
    const transcation = await prismaTransaction.transactions.create({data})

    return transcation

  } catch (error: any) {
    console.log(error)
    throw Error(error);
  }
}

export const getByIdWithType = async (
  userId: string,
  arrayTypes: string[]
) => {
  try {
    const transactions = (await prismaTransaction.transactions.findMany({
      where: {
        OR: [{ agentId: userId }, { userId: userId }],
        type: {
          in: arrayTypes
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        agentId: true,
        userId: true,
        amount: true,
        gameId: true,
        type: true,
        status: true,
        createdAt: true
      }
    })) as any;

    return transactions;
  } catch (error: any) {
    throw Error(error);
  }
};

export const getDetailsById = async (id: string, userId: string) => {
  try {  
    
    const transaction = await prismaTransaction.transactions.findUnique({
      select: {
        id: true,
        amount: true,
        token: true,
        agentId: true,
        userId: true,
        type: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        currencyCode: true
      },
      where: {
        id
      }
    });

    return transaction;
  } catch (error: any) {
    throw Error(error);
  }
};
