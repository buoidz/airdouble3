import { ColumnType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const tableRouter = createTRPCRouter({
  createTableByBaseId: publicProcedure
    .input(z.object({ baseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;

      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: 'You must be logged in to add table'
        })
      }

      const base = await ctx.db.base.findUnique({ where: {id: input.baseId} })

      if (!base || base.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to alter this base.",
        });
      }

      // 1. Create the table in the base
      const table = await ctx.db.table.create({
        data: { name: "Table 1", baseId: base.id, ownerId: currentUser.id },
      });

      // 2. Create default columns in the first table
      await ctx.db.column.createMany({
        data: [
          { name: "Name", type: ColumnType.TEXT, tableId: table.id, order: 1 },
          { name: "Notes", type: ColumnType.TEXT, tableId: table.id, order: 2 },
          { name: "Assignee", type: ColumnType.TEXT, tableId: table.id, order: 3 },
        ],
      });
              
      // 3. Create three empty rows in the first table with empty cells for each column
      const createedColumn = await ctx.db.column.findMany({where: {tableId: table.id}});

      for (let i = 0; i < 3; i++) {
        const row = await ctx.db.row.create({
          data: { tableId: table.id, order:  i },
        });

        await ctx.db.cell.createMany({
          data: createedColumn.map((column) => ({
            rowId: row.id,
            columnId: column.id,
            textValue: "",
          })),
        });
      } 

      return table;

    }),

  renameTable: publicProcedure
    .input(z.object({ baseId: z.string(), tableId: z.string(), newName: z.string()}))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: 'You must be logged in to add table'
        })
      }

      const base = await ctx.db.base.findUnique({ where: {id: input.baseId} })
      if (!base || base.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to alter this base.",
        });
      }

      const table = await ctx.db.table.findUnique({ where: {id: input.tableId}})
      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found.",
        });
      } 

      return ctx.db.table.update({
        where: {id: input.tableId},
        data: {name: input.newName}
      })

    }),

  deleteTableById: publicProcedure
    .input(z.object({ baseId: z.string(), tableId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: 'You must be logged in to add table'
        })
      }

      const base = await ctx.db.base.findUnique({ where: {id: input.baseId} })
      if (!base || base.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to alter this base.",
        });
      }

      const table = await ctx.db.table.findUnique({ where: {id: input.tableId}})
      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found.",
        });
      } 

      await ctx.db.table.delete({ where: { id: input.tableId } });
    }),

  getRowDataByTableId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      const table = await ctx.db.table.findUnique({
        where: { id: input.id },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found.",
        });
      } 

      if (!currentUser || table.ownerId !== currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this table.",
        });
      }

      const rowData = await ctx.db.row.findMany({
        where: { tableId: input.id },
        orderBy: { order: "asc" },
        include: {
          cells: {
            select: {
              id: true,
              columnId: true,
              textValue: true,
              numberValue: true,
            }
          }
        }
      });

      if (rowData.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No rows found for this table.",
        });
      }

      return rowData;
    }),

  getColumnDataByTableId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      const table = await ctx.db.table.findUnique({
        where: { id: input.id },
        include: {
          columns: {
            orderBy: { order: "asc" }
          }
        }
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found.",
        });
      }

      if (!currentUser || table.ownerId !== currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this table.",
        });
      }

      return table.columns;
    }),

  updateCell: publicProcedure
    .input(z.object({ tableId: z.string(), rowIndex: z.number(), columnId: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update a cell.",
        });
      }

      const table = await ctx.db.table.findUnique({
        where: { id: input.tableId },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found.",
        });
      }

      if (table.ownerId !== currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this table.",
        });
      }

      const row = await ctx.db.row.findFirst({
        where: { tableId: input.tableId, order: input.rowIndex },  
        include: { cells: true },    
      });

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Row not found.",
        });
      }

      const column = await ctx.db.column.findUnique({
        where: { id: input.columnId },
      });
      if (!column) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Column not found.",
        });
      }

      const cell = row.cells.find(c => c.columnId === input.columnId);
      if (!cell) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cell not found.",
        });
      }
      
      if (column.type === "TEXT") {
        const updatedCell = await ctx.db.cell.update({
          where: { id: cell.id },
          data: { textValue: input.value, numberValue: null },
        });
        return updatedCell;
      } else if (column.type === "NUMBER") {
        const numberValue = parseFloat(input.value);
        if (isNaN(numberValue)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid number value.",
          });
        }
        const updatedCell = await ctx.db.cell.update({
          where: { id: cell.id },
          data: { numberValue: numberValue, textValue: null },
        });
        return updatedCell;
      } 
    }),
})
