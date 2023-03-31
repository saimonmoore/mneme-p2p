import { logger } from '#infrastructure/logging/index.js';

export function sessionRequired(
  // @ts-ignore
  target: any,
  // @ts-ignore
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    // @ts-ignore
    const session = this.session;

    if (!session.isLoggedIn()) {
      logger.error('You must be logged in to use this method');
      return { error: 'You must be logged in to use this method' };
    }

    return originalMethod.apply(this, args);
  };

  descriptor.value.sessionRequired = sessionRequired;

  return descriptor;
}
