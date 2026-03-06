import {
    jest,
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
} from "@jest/globals";
import { RAGService } from "../rag-service";

// Suppress expected console.error output from error-path tests
beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => { });
});

afterAll(() => {
    jest.restoreAllMocks();
});

// Minimal valid RTF helper that wraps plain text in an RTF document
function makeRTFBuffer(body: string): Buffer {
    return Buffer.from(`{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}${body}}`, "ascii");
}

describe("RAGService — RTF extraction", () => {
    let service: RAGService;

    beforeAll(() => {
        service = new RAGService();
    });

    afterAll(() => {
        service.cleanup();
    });

    it("extracts plain text from a normal RTF document", async () => {
        const buffer = makeRTFBuffer("\\f0\\fs24 Hello World\\par ");

        const result = await service.extractContent(buffer, "application/rtf");

        expect(result).toContain("Hello World");
    });

    it("strips RTF formatting control words and returns readable text", async () => {
        // RTF with bold, italic, and underline control words wrapping the text
        const buffer = makeRTFBuffer(
            "\\b Bold Text\\b0  and \\i italic\\i0  and \\ul underlined\\ulnone\\par ",
        );

        const result = await service.extractContent(buffer, "application/rtf");

        // Formatting control words must be stripped — only text should remain
        expect(result).toContain("Bold Text");
        expect(result).toContain("italic");
        expect(result).toContain("underlined");
        expect(result).not.toMatch(/\\b\b/); // no raw \b control word in output
    });

    it("throws a descriptive error for an empty RTF document", async () => {
        // An RTF with no text body — officeparser will return an empty string
        const buffer = Buffer.from("{\\rtf1}", "ascii");

        await expect(
            service.extractContent(buffer, "application/rtf"),
        ).rejects.toThrow("RTF document contains no readable text content");
    });
});
