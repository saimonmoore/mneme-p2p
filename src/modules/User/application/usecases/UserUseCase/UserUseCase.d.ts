declare class UserUseCase {
    constructor(bee: any, autobase: any, sessionUseCase: any);
    users(): AsyncGenerator<any, void, unknown>;
    friends(): AsyncGenerator<any, void, unknown>;
    friendsByName(text: any): AsyncGenerator<any, void, unknown>;
    friendsByEmail(text: any): AsyncGenerator<any, void, unknown>;
    signup(user: any): Promise<void>;
    addFriend(hash: any): Promise<void>;
}
export { UserUseCase };
//# sourceMappingURL=UserUseCase.d.ts.map