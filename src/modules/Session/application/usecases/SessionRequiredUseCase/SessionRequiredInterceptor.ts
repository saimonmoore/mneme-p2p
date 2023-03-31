import { logger } from '#infrastructure/logging/index.js';

export function sessionRequiredInterceptor(object: any) {
  const handler = {
    get(target: any, propKey: string, receiver: any) {
      const origMethod = target[propKey];

      if (typeof origMethod === 'function') {
        const descriptor = Object.getOwnPropertyDescriptor(target, propKey);

        if (
          descriptor &&
          descriptor.value &&
          descriptor.value.sessionRequired
        ) {
          const decoratedMethod = descriptor.value.sessionRequired(
            target,
            propKey,
            descriptor
          );

          return function (...args: any[]) {
            return decoratedMethod.value.apply(target, args);
          };
        } else {
          return origMethod.bind(target);
        }
      }

      if (!origMethod) {
        logger.error('Method not found ', { target, propKey, receiver });
        return;
      }

      return origMethod.bind(target);
    },
  };

  return new Proxy(object, handler);
}
