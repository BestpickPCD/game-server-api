import {
  Prisma,
  PrismaClient,
  Users
} from '../config/prisma/generated/base-default/index.js';
const prisma = new PrismaClient();

const NOT_FOUND = 'Agent not found';
interface AgentsParams {
  id?: number;
  level?: number | null;
  page?: number;
  size?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: number;
}

interface AgentUpdateParams {
  agentId: number;
  parentAgentId: number | null;
  currencyId: number | null;
  roleId: number | null;
  rate?: number | null;
  name?: string;
}

const filterArrays = (a: any[], b: number[]) =>
  a.filter((aItem) => !b.some((bItem) => aItem === bItem));

const mergeArrays = (a: any[], b: number[]) => [...a, ...b];

const resultArray = (a: any[], b: number[], c: any[]) =>
  mergeArrays(filterArrays(a, b), c);

export const getAll = async ({
  id,
  level,
  page = 0,
  size = 10,
  search,
  dateFrom,
  dateTo
}: AgentsParams): Promise<{
  users: Users[];
  totalItems: number;
}> => {
  try {
    const filter: Prisma.UsersFindManyArgs = {
      select: {
        id: true,
        username: true,
        name: true,
        type: true,
        currencyId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        balance: true,
        rate: true,
        level: true,
      },
      where: {
        deletedAt: null,
        type: 'agent',
        parentAgentIds: {
          array_contains: [id] as number[]
        },
        ...(level && { level }),
        OR: [
          {
            name: {
              contains: search
            }
          },
          {
            username: {
              contains: search
            }
          }
        ],
        updatedAt: {
          gte: dateFrom || '1970-01-01T00:00:00.000Z',
          lte: dateTo || '2100-01-01T00:00:00.000Z'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: page * size,
      take: size
    }; 

    const [users, totalItems] = await prisma.$transaction([
      prisma.users.findMany(filter),
      prisma.users.count({ where: filter.where })
    ]);

    return { users, totalItems };
  } catch (error: any) {
    throw Error(error.message);
  }
};

export const getById = async ({ id, userId }: AgentsParams): Promise<any> => {
  try {
    const agent = await prisma.users.findUnique({
      select: {
        id: true,
        username: true,
        name: true,
        type: true,
        currencyId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        balance: true,
        level: true,
        rate: true,
      },
      where: {
        id,
        deletedAt: null,
        type: 'agent', 
        parentAgentIds: {
          array_contains: [userId] as number[]
        }
      } 
    });
    if (!agent) {
      throw Error(NOT_FOUND);
    }
    return agent;
  } catch (error: any) {
    throw Error(error.message);
  }
};

const getAgentById = async (agentId: number): Promise<any> => {
  try {
    const agent = await prisma.users.findUnique({
      select: {
        parentAgentIds: true,
        level: true,
        currencyId: true,
        roleId: true
      },
      where: {
        type: 'agent',
        id: agentId
      }
    });
    if (!agent) {
      throw Error(NOT_FOUND);
    }
    return agent;
  } catch (error: any) {
    throw Error(error.message);
  }
};

const validateUpdateData = async ({
  agentId,
  parentAgentId,
  currencyId,
  roleId
}: AgentUpdateParams): Promise<any> => {
  try {
    const agent = await getAgentById(agentId);
    const parentAgentIdNumber = parentAgentId
      ? Number(parentAgentId)
      : agent.parentAgentId;
    const currencyIdNumber = currencyId
      ? Number(currencyId)
      : agent.user?.currencyId;
    const roleIdNumber = roleId ? Number(roleId) : agent.user?.roleId;
    if (
      !parentAgentIdNumber ||
      !currencyIdNumber ||
      !roleIdNumber ||
      parentAgentIdNumber === agentId
    ) {
      const missingItem =
        !parentAgentIdNumber || parentAgentIdNumber === agentId
          ? 'Parent Agent'
          : !roleIdNumber
          ? 'Role'
          : 'Currency';
      throw Error(`${missingItem} not valid`);
    }
    const [parentAgent, role, currency] = await Promise.all([
      parentAgentIdNumber && agent.parentAgentId
        ? prisma.users.findUnique({ where: { id: parentAgentIdNumber } })
        : null,
      roleIdNumber && roleIdNumber !== agent.user?.roleId
        ? prisma.roles.findUnique({ where: { id: roleIdNumber } })
        : null,
      currencyIdNumber && roleIdNumber !== agent.user?.currencyId
        ? prisma.currencies.findUnique({ where: { id: currencyIdNumber } })
        : null
    ]);
    if (!parentAgent && parentAgentIdNumber && agent.parentAgentId) {
      throw Error('Parent Agent not found');
    }
    if (!role && roleIdNumber && roleIdNumber !== agent.user?.roleId) {
      throw Error('Role not found');
    }
    if (!currency && roleIdNumber && roleIdNumber !== agent.user?.currencyId) {
      throw Error('Currency not found');
    }
    const updatedAgentParentIds = parentAgent && [
      ...(parentAgent?.parentAgentIds as any),
      parentAgent.id
    ];
    updateChildAgent({ agentId, agent, parentAgent });
    return { agent, parentAgent, role, currency, updatedAgentParentIds };
  } catch (error: any) {
    throw Error(error.message);
  }
};

const updateChildAgent = async ({
  agentId,
  agent,
  parentAgent
}: {
  agentId: number;
  agent: Users;
  parentAgent: Users | null;
}) => {
  const agentChildren: Users[] = await prisma.users.findMany({
    where: {
      type: "agent",
      parentAgentIds: {
        array_contains: [agentId]
      }
    }
  });

  if (agentChildren.length > 0) {
    for (let i = 0; i < agentChildren.length; i++) {
      const parentAgentIds: any[] = resultArray(
        agentChildren[i]?.parentAgentIds as number[],
        agent.parentAgentIds as number[],
        parentAgent
          ? ([...(parentAgent?.parentAgentIds as any), parentAgent.id] as any)
          : agent.parentAgentIds
      ) as any;
      await prisma.users.update({
        where: {
          type: "agent",
          id: agentChildren[i].id
        },
        data: {
          parentAgentIds,
          level: parentAgentIds.length + 1
        }
      });
    }
  }
};

export const update = async ({
  agentId,
  parentAgentId,
  currencyId,
  roleId,
  rate,
  name
}: AgentUpdateParams) => {
  try {
    const { updatedAgentParentIds, agent, parentAgent, role, currency } =
      await validateUpdateData({
        agentId,
        parentAgentId,
        currencyId,
        roleId
      });

    const [updatedAgent] = await prisma.$transaction([
      prisma.users.update({
        where: { id: agentId },
        data: {
          parentAgentId: parentAgentId || agent.parentAgentId,
          name,
          roleId: role?.id,
          currencyId: currency?.id
        }
      }),
      prisma.users.update({
        where: { 
          type: "agent", 
          id: agentId 
        },
        data: {
          rate,
          parentAgentIds: parentAgent
            ? (updatedAgentParentIds as any)
            : agent.parentAgentIds,
          level: parentAgent
            ? (updatedAgentParentIds as any)?.length + 1
            : agent.level
        }
      })
    ]);

    return updatedAgent;
  } catch (error: any) {
    throw Error(error.message);
  }
};

export const deleteAgent = async (id: number, userId: number) => {
  try {
    const users = await getById({ id, userId });
    if (!users) {
      throw Error('Agent not found');
    }
    await prisma.users.update({
      where: {
        id
      },
      data: {
        deletedAt: new Date()
      }
    });
  } catch (error: any) {
    throw Error(error.message);
  }
};
