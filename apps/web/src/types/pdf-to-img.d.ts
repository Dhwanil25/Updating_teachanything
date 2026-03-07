declare module "pdf-to-img" {
  export interface PdfToImgOptions {
    scale?: number;
  }

  export type PdfDocument = AsyncIterable<Buffer>;

  export function pdf(
    input: string | Buffer | Uint8Array,
    options?: PdfToImgOptions,
  ): Promise<PdfDocument>;
}

