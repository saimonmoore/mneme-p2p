declare class RecordUseCase {
    constructor(bee: any, autobase: any, session: any);
    records(): AsyncGenerator<any, void, unknown>;
    keywords(): AsyncGenerator<any, void, unknown>;
    recordsForKeyword(keyword: any): AsyncGenerator<any, void, unknown>;
    tags(): AsyncGenerator<any, void, unknown>;
    recordsForTag(tag: any): AsyncGenerator<any, void, unknown>;
    record(data: any): Promise<{
        error: import("jsonschema").ValidationError[];
    } | undefined>;
}
export { RecordUseCase };
//# sourceMappingURL=RecordUseCase.d.ts.map