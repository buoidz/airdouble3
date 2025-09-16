import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import z from "zod";
import { filterSchema, sortSchema } from "./table";

export const viewRouter = createTRPCRouter({
  saveView: publicProcedure
    .input(z.object({
      id: z.string(),
      tableId: z.string(),
      name: z.string(),
      filterConfig: z.array(filterSchema).default([]),
      filterCondition: z.enum(["AND", "OR"]).default("AND"),
      sortConfig: z.array(sortSchema).default([]),
      searchTerm: z.string().optional(),
      columnVisibility: z.record(z.boolean()).default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: 'You must be logged in to add table'
        })
      }

      const table = await ctx.db.table.findUnique({ where: {id: input.tableId}})
      if (!table || table.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to alter this table.",
        });
      }

      const view = await ctx.db.view.findUnique({ where: {id: input.id}})
        if (view?.tableId != table.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to alter this view.",
        });
      }

      return ctx.db.view.update({
        where: {id: input.id},
        data: {
          tableId: input.tableId,
          name: input.name,
          filterConfig: input.filterConfig, 
          filterCondition: input.filterCondition,
          sortConfig: input.sortConfig,
          searchTerm: input.searchTerm,
          columnVisibility: input.columnVisibility,
        },
      });
    }),


  createView: publicProcedure
    .input(z.object({
      tableId: z.string(),
      name: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: 'You must be logged in to add table'
        })
      }

      const table = await ctx.db.table.findUnique({ where: {id: input.tableId}})
      if (!table || table.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to alter this table.",
        });
      }

      const columns = await ctx.db.column.findMany({ where: { tableId: table.id } });

      const columnVisibility: Record<string, boolean> = {};
      columns.forEach(col => {
        columnVisibility[col.id] = true;
      });

      const lastView = await ctx.db.view.findFirst({
        where: { tableId: table.id },
        orderBy: { order: 'desc' },
      });

      const viewOrder = lastView ? lastView.order + 1 : 0;

      const view = await ctx.db.view.create({
        data: {
          tableId: table.id,
          name: `Grid ${viewOrder+1}`,
          order: viewOrder,
          filterConfig: [],
          filterCondition: "AND",
          sortConfig: [],
          searchTerm: null,
          columnVisibility: columnVisibility,
        },
      });


      return view;
    }),

  deleteView: publicProcedure
    .input(z.object({
      tableId: z.string(),
      viewId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: 'You must be logged in to add table'
        })
      }

      const table = await ctx.db.table.findUnique({ where: {id: input.tableId}})
      if (!table || table.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to alter this table.",
        });
      }

      const view = await ctx.db.view.findUnique({
        where: { id: input.viewId },
      });
      if (!view || view.tableId !== input.tableId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "View not found for this table.",
        });
      }

      await ctx.db.view.delete({
        where: { id: input.viewId },
      });
    }),

  getAllViewByTableId: publicProcedure
    .input(z.object({
      tableId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: 'You must be logged in to add table'
        })
      }

      const table = await ctx.db.table.findUnique({ where: {id: input.tableId}})
      if (!table || table.ownerId != currentUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to alter this table.",
        });
      }

      const views = await ctx.db.view.findMany({ 
        where: {tableId: input.tableId},
        orderBy: { order: 'asc' },
      })
      if (!views) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "There is no view available for this table",
        })
      }

      return views;
    }),
})