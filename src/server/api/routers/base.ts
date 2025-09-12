import { ColumnType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { faker } from '@faker-js/faker';


import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const baseRouter = createTRPCRouter({
  createBase: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a base.",
        });
      }

      const base = await ctx.db.$transaction(async () => {
        // 1. Create the base
        const base = await ctx.db.base.create({
          data: {
            name: input.name,
            ownerId: currentUser.id,
          },
        });

        // 2. Create the first table in the base
        const firstTable = await ctx.db.table.create({
          data: { name: "Table 1", baseId: base.id, ownerId: currentUser.id },
        });

        // 3. Create default columns in the first table
        await ctx.db.column.createMany({
          data: [
            { name: "Name", type: ColumnType.TEXT, tableId: firstTable.id, order: 1 },
            { name: "Notes", type: ColumnType.TEXT, tableId: firstTable.id, order: 2 },
            { name: "Assignee", type: ColumnType.TEXT, tableId: firstTable.id, order: 3 },
          ],
        });
                
        // 4. Create three empty rows in the first table with empty cells for each column
        const createdColumn = await ctx.db.column.findMany({where: {tableId: firstTable.id}});

        for (let i = 0; i < 3; i++) {
          const row = await ctx.db.row.create({
            data: { tableId: firstTable.id, order:  i },
          });

          await ctx.db.cell.createMany({
            data: createdColumn.map((column) => ({
              rowId: row.id,
              columnId: column.id,
              textValue: faker.lorem.words({min: 1, max: 3}),
            })),
          });
        } 

        return base;
      });

      return base;
    }),

  renameBase: publicProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to rename a base.",
        });
      }
      
      const base = await ctx.db.base.findUnique({
        where: { id: input.id },
      });

      if (!base || base.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to rename this base.",
        });
      }

      return ctx.db.base.update({
        where: {id: input.id},
        data: {name: input.name},
      })
    }),


  getAllBases: publicProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to see your base.",
        });
      }

    const bases = await ctx.db.base.findMany({
      orderBy: { createdAt: "desc" },
      where: { ownerId: currentUser.id },
    });

    return bases;
  }),

  getBaseById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to see this base.",
        });
      }
      const base = await ctx.db.base.findUnique({
        where: { id: input.id },
      });

      if (!base || base.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this base.",
        });
      }

      return base;
    }),

    getFirstTableBaseById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to see this base.",
        });
      }
      const base = await ctx.db.base.findUnique({
        where: { id: input.id },
      });

      if (!base || base.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this base.",
        });
      }

      const table = await ctx.db.table.findFirst({
        where: { baseId: base.id },
        orderBy: { createdAt: "asc" },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No tables found in this base.",
        });
      }

      return table;
    }),

    getAllTablesBaseById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const currentUser = ctx.currentUser;
        if (!currentUser) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to see this base.",
          });
        }
        const base = await ctx.db.base.findUnique({
          where: { id: input.id },
        });

        if (!base || base.ownerId != currentUser.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to view this base.",
          });
        }

        const table = await ctx.db.table.findMany({
          where: { baseId: base.id },
          orderBy: { createdAt: "asc" },
        });

        if (!table) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No tables found in this base.",
          });
        }

        return table;
      }),
});
