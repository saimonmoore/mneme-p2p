declare class Mneme {
    constructor();
    start(): Promise<void>;
    info(): void;
    records(): AsyncGenerator<any, void, any>;
    keywords(): AsyncGenerator<any, void, any>;
    tags(): AsyncGenerator<any, void, any>;
    recordsForKeyword(keyword: any): AsyncGenerator<any, void, any>;
    recordsForTag(tag: any): AsyncGenerator<any, void, any>;
    record(data: any): Promise<any>;
    posts(): AsyncGenerator<any, void, any>;
    topPosts(): AsyncGenerator<any, void, any>;
    post(text: any): Promise<any>;
    upvote(hash: any): Promise<any>;
    downvote(hash: any): Promise<any>;
    users(): AsyncGenerator<any, void, any>;
    friends(): AsyncGenerator<any, void, any>;
    friendsByName(text: any): AsyncGenerator<any, void, any>;
    friendsByEmail(text: any): AsyncGenerator<any, void, any>;
    signup(user: any): Promise<any>;
    addFriend(user: any): Promise<any>;
    isLoggedIn(): any;
    login(email: any): Promise<any>;
    logout(): any;
}
export declare const mneme: Mneme;
export {};
//# sourceMappingURL=mneme.d.ts.map