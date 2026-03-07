"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface FileTextPreviewDialogProps {
    fileId: string;
    fileName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FileTextPreviewDialog({
    fileId,
    fileName,
    open,
    onOpenChange,
}: FileTextPreviewDialogProps) {
    const [copied, setCopied] = useState(false);

    const { data, isLoading, error } = trpc.files.getChunks.useQuery(
        { fileId },
        { enabled: open },
    );

    const fullText = data?.chunks.map((c) => c.content).join("\n\n") ?? "";

    const handleCopyAll = async () => {
        if (!fullText) return;
        await navigator.clipboard.writeText(fullText);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        Extracted Text
                    </DialogTitle>
                    <DialogDescription>
                        This is all the text the AI extracted from{" "}
                        <span className="font-medium">{fileName}</span>.{" "}
                        {data && (
                            <span>
                                {data.chunkCount} section{data.chunkCount !== 1 ? "s" : ""}
                                {" · "}
                                {data.chunks.reduce((sum, c) => sum + (c.tokenCount ?? 0), 0).toLocaleString()} tokens
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0 gap-3">
                    {isLoading && (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                            <span className="text-muted-foreground">Loading extracted text…</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-4">
                            Failed to load text: {error.message}
                        </div>
                    )}

                    {data && (
                        <>
                            {/* Copy all button */}
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyAll}
                                    className="gap-1.5"
                                >
                                    {copied ? (
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                    {copied ? "Copied!" : "Copy all text"}
                                </Button>
                            </div>

                            {/* Scrollable text content */}
                            <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-4 min-h-0">
                                {data.chunks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No text was extracted from this file.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {data.chunks.map((chunk, i) => (
                                            <div key={i}>
                                                {data.chunks.length > 1 && (
                                                    <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                                                        Section {chunk.chunkIndex + 1}
                                                    </p>
                                                )}
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                    {chunk.content}
                                                </p>
                                                {i < data.chunks.length - 1 && (
                                                    <hr className="mt-4 border-border/50" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
