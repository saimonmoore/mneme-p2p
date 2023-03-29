declare class SessionUseCase {
    constructor(bee: any, autobase: any);
    isLoggedIn(): boolean;
    directLogin(user: any): void;
    login(email: any): Promise<void>;
    logout(): void;
}
export { SessionUseCase };
//# sourceMappingURL=SessionUseCase.d.ts.map