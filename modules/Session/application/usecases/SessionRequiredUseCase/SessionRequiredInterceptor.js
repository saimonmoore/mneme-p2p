export function sessionRequiredInterceptor(object) {
  const handler = {
    get(target, propKey, receiver) {
      const origMethod = target[propKey];
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
