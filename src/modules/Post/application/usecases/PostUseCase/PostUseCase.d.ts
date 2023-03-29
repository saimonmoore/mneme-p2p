declare class PostUseCase {
    constructor(bee: any, autobase: any, session: any);
    posts(): AsyncGenerator<any, void, unknown>;
    topPosts(): AsyncGenerator<any, void, unknown>;
    post(data: any): Promise<void>;
}
export { PostUseCase };
//# sourceMappingURL=PostUseCase.d.ts.map