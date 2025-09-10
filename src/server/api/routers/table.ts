import { TRPCError } from "@trpc/server";
import z from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const tableRouter = createTRPCRouter({
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
