import { faker } from "@faker-js/faker";
import { ColumnType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";


export const filterSchema = z.object({
  columnId: z.string(),
  type: z.enum(['numGreaterThan', 'numSmallerThan', 'numEqualTo', 'textNotEmpty', 'textIsEmpty', 'textContains', 'textNotContains', 'textEqualTo']),
  value: z.string().optional(),
})

export const sortSchema = z.object({
  columnId: z.string(),
  type: z.enum(['numASC', 'numDESC', 'textASC', 'textDESC']),
})

export type CellData = {
  id: string;
  columnId: string;
  textValue: string | null;
  numberValue: number | null;
  containSearchTerm: true | false;
};

export type RowDataRaw = {
  id: string;
  cells: CellData[];
};

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
            textValue: faker.lorem.words({min: 1, max: 3}),
          })),
        });
      } 

      const view = await ctx.db.view.create({
        data: {
          tableId: table.id,
          name: "Grid 1",
          filterConfig: [],
          filterCondition: "AND",
          sortConfig: [],
          searchTerm: null,
          columnVisibility: {},
        },
      });

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

  addRow: publicProcedure
    .input(z.object({
      tableId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to add rows.",
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

      const columns = await ctx.db.column.findMany({
        where: { tableId: input.tableId }
      })
      if (!columns) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table columns not found.",
        })
      }

      const oldRows = await ctx.db.row.findFirst({
        where: { tableId: input.tableId },
        orderBy: { order: "desc" }
      })
      
      const newOrder = oldRows ? oldRows.order + 1 : 0;
      const newRow = await ctx.db.row.create({
        data: { tableId: input.tableId, order: newOrder }
      })

      await ctx.db.cell.createMany({
        data: columns.map((column) => ({
          rowId: newRow.id,
          columnId: column.id,
          textValue: column.type === ColumnType.TEXT ? faker.lorem.words({min: 1, max: 3}) : null,
          numberValue: column.type === ColumnType.NUMBER ? faker.number.int({ max: 1000000000000}) : null,
        })),
      });
    }),

  add100kRows: publicProcedure
    .input(z.object({
      tableId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to add rows.",
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
      
      const columns = await ctx.db.column.findMany({
        where: { tableId: input.tableId }
      })

      if (!columns) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table columns not found.",
        })
      }

      const oldRows = await ctx.db.row.findFirst({
        where: { tableId: input.tableId },
        orderBy: { order: "desc" }
      })
      
      let currentOrder = oldRows ? oldRows.order + 1 : 0;
      const batchSize = 1000;
      const numBatch = 1000 / 1000;

      for (let i = 0; i < numBatch; i++) {
        const dataRows = Array.from({ length: batchSize}, (_, index) => ({
          tableId: input.tableId,
          order: currentOrder + index,
        }));

        await ctx.db.row.createMany({
          data: dataRows
        })

        const insertedRows = await ctx.db.row.findMany({
          where: {
            tableId: input.tableId,
            order: {
              gte: currentOrder,
              lt: currentOrder + batchSize,
            },
          },
          orderBy: { order: "asc" },
        });

        await ctx.db.cell.createMany({
          data: columns.flatMap((column) => (
            insertedRows.map((row) => ({
              rowId: row.id,
              columnId: column.id,
              textValue: column.type === ColumnType.TEXT ? faker.lorem.words({min: 1, max: 3}) : null,
              numberValue: column.type === ColumnType.NUMBER ? faker.number.int({ max: 1000000000000}) : null,
            }))
          )),
        });

        currentOrder += batchSize;
      }
    }),



  addColumns: publicProcedure
    .input(z.object({
      tableId: z.string(),
      name: z.string(),
      type: z.nativeEnum(ColumnType),
    }))
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

      const oldCols = await ctx.db.column.findFirst({
        where: { tableId: input.tableId },
        orderBy: { order: "desc" }
      })

      const newOrder = oldCols ? oldCols.order + 1 : 0;

      const newCol = await ctx.db.column.create({
        data: { tableId: input.tableId, name: input.name, type: input.type, order: newOrder}
      })

      const rows = await ctx.db.row.findMany({
        where: { tableId: input.tableId },
      })

      await ctx.db.cell.createMany({
        data: rows.map((rows) => ({
          rowId: rows.id,
          columnId: newCol.id,
          textValue: newCol.type === ColumnType.TEXT ? faker.lorem.words({min: 1, max: 3}) : null,
          numberValue: newCol.type === ColumnType.NUMBER ? faker.number.int({ max: 1000000000000}) : null,
        })),
      });
    }),

  getRowDataByOperations: publicProcedure
    .input(z.object({
      tableId: z.string(),
      filters: z.array(filterSchema).default([]),
      filterCondition: z.string(),
      sorts: z.array(sortSchema).default([]),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.currentUser;
      if (!currentUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update a cell.",
        });
      }

      const table = await ctx.db.table.findUnique({
        where: { id: input.tableId },
        include: { 
          columns: {
            orderBy: { order: 'asc' }
          }
        }
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

      // filtering
      const filterFragments: string[] = [];
      const filterParams: (string | number)[] = [input.tableId]; // $1 = tableId
      let paramIndex = 2;

      input.filters.forEach((filter) => {
        let condition = "";
        if (filter.value === undefined || filter.value === null) return;
        
        switch (filter.type) {
          case "numEqualTo":
            condition = `"numberValue" = $${paramIndex++}`;
            filterParams.push(Number(filter.value));
            break;
          case "numGreaterThan":
            condition = `"numberValue" > $${paramIndex++}`;
            filterParams.push(Number(filter.value));
            break;
          case "numSmallerThan":
            condition = `"numberValue" < $${paramIndex++}`;
            filterParams.push(Number(filter.value));
            break;
          case "textContains":
            condition = `"textValue" ILIKE $${paramIndex++}`;
            filterParams.push(`%${filter.value}%`);
            break;
          case "textEqualTo":
            condition = `"textValue" = $${paramIndex++}`;
            filterParams.push(filter.value);
            break;
          case "textIsEmpty":
            condition = `("textValue" = '' OR "textValue" IS NULL)`;
            break;
          case "textNotContains":
            condition = `"textValue" NOT ILIKE $${paramIndex++}`;
            filterParams.push(`%${filter.value}%`);
            break;
          case "textNotEmpty":
            condition = `("textValue" <> '' AND "textValue" IS NOT NULL)`;
            break;
        }

        filterFragments.push(`
          EXISTS (
            SELECT 1 FROM "Cell" f
            WHERE f."rowId" = r.id
              AND f."columnId" = $${paramIndex++}
              AND ${condition}
          )
        `);

        filterParams.push(filter.columnId);
      });

      const filterClause = filterFragments.length > 0
        ? `AND (${filterFragments.join(` ${input.filterCondition} `)})`
        : "";
      
      // sorting
      const joinClauses: string[] = [];
      const orderByClauses: string[] = [];
      const groupByClauses: string[] = ['r.id']

      input.sorts.forEach((sort, i) => {
        const alias = `s${i}`;
        const colField = sort.type.startsWith("text") ? "textValue" : "numberValue";
        const direction = sort.type.endsWith("ASC") ? "ASC" : "DESC";

        joinClauses.push(`
          LEFT JOIN "Cell" ${alias} ON ${alias}."rowId" = r.id AND ${alias}."columnId" = $${paramIndex++}
        `);

        filterParams.push(sort.columnId);
        orderByClauses.push(`${alias}."${colField}" ${direction} NULLS LAST`);

        groupByClauses.push(`${alias}."${colField}"`);
      });

      const orderBySQL = orderByClauses.length > 0 ? `ORDER BY ${orderByClauses.join(", ")}` : "";
      const groupBySQL = `GROUP BY ${groupByClauses.join(", ")}`;


    // searching
    let searchClause = "";
    if (input.search) {
      const searchParam = `%${input.search}%`;
      filterParams.push(searchParam);
      searchClause = `
        AND EXISTS (
          SELECT 1 FROM "Cell" sc
          WHERE sc."rowId" = r.id
            AND (
              sc."textValue" ILIKE $${filterParams.length}
              OR CAST(sc."numberValue" AS TEXT) ILIKE $${filterParams.length}
            )
        )
      `;
    }


      const sql = `
        SELECT r.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', c.id,
                    'columnId', c."columnId",
                    'textValue', c."textValue",
                    'numberValue', c."numberValue",
                    'containSearchTerm',
                      CASE
                        WHEN $${filterParams.length} IS NOT NULL
                        AND (
                              c."textValue" ILIKE $${filterParams.length}
                              OR CAST(c."numberValue" AS TEXT) ILIKE $${filterParams.length}
                            )
                        THEN true
                        ELSE false
                      END
                  )
                ) FILTER (WHERE c.id IS NOT NULL), '[]'
              ) AS cells
        FROM "rows" r
        LEFT JOIN "Cell" c ON c."rowId" = r.id
        ${joinClauses.join("\n")}
        WHERE r."tableId" = $1
        ${filterClause}
        ${searchClause}
        ${groupBySQL}
        ${orderBySQL}
      `;


      const rows = await ctx.db.$queryRawUnsafe<RowDataRaw[]>(sql, ...filterParams);

      const cleanRows: RowDataRaw[] = rows.map(row => ({
        ...row,
        cells: row.cells.map((cell: { id: string; columnId: string; textValue: string | null; numberValue: number | null; containSearchTerm: true | false}) => ({
          id: cell.id,
          columnId: cell.columnId,
          textValue: cell.textValue,
          numberValue: cell.numberValue,
          containSearchTerm: cell.containSearchTerm,
        }))
      }))

      return cleanRows;
    })


})
