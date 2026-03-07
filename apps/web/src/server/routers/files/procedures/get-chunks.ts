import { protectedProcedure } from "@/server/trpc";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { userFiles, fileChunks } from "@teachanything/db/schema";

/**
 * Get the extracted text chunks for a completed file
 * Used by the "View Extracted Text" dialog to let users see what was extracted
 */
export const getChunksProcedure = protectedProcedure
    .input(z.object({ fileId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
        // Verify ownership
        const [file] = await ctx.db
            .select()
            .from(userFiles)
            .where(
                and(
                    eq(userFiles.id, input.fileId),
                    eq(userFiles.userId, ctx.session.user.id),
                ),
            )
            .limit(1);

        if (!file) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "File not found",
            });
        }

        if (file.processingStatus !== "completed") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "File has not been processed yet",
            });
        }

        const chunks = await ctx.db
            .select({
                chunkIndex: fileChunks.chunkIndex,
                content: fileChunks.content,
                tokenCount: fileChunks.tokenCount,
            })
            .from(fileChunks)
            .where(eq(fileChunks.fileId, input.fileId))
            .orderBy(asc(fileChunks.chunkIndex));

        return {
            fileName: file.fileName,
            fileType: file.fileType,
            chunkCount: chunks.length,
            chunks,
        };
    });
