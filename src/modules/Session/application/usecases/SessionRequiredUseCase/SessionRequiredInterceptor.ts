export function sessionRequiredInterceptor(object: any) {
  const handler = {
    get(target: any, propKey: string, receiver: any) {
      const origMethod = target[propKey];
      // @ts-ignore
      return function(...args) {
        const session = target.session;

        if (!session.isLoggedIn()) {
          console.error('You must be logged in to use this method');
          return;
        }

        if (!origMethod) {
          console.error('Method not found ', { target, propKey, receiver, args });
          return;
        }

        return origMethod.apply(target, args);
      };
    },
  };

  return new Proxy(object, handler);
}
