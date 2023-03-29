export declare const USERS_KEY = "org.mneme.users!";
export declare const FRIENDS_KEY: (userHash: any) => string;
export declare const FRIENDS_BY_NAME_KEY: (userHash: any) => string;
export declare const FRIENDS_BY_EMAIL_KEY: (userHash: any) => string;
export declare function indexUsers(batch: any, operation: any): Promise<void>;
export declare function indexFriends(batch: any, operation: any): Promise<void>;
//# sourceMappingURL=users.index.d.ts.map