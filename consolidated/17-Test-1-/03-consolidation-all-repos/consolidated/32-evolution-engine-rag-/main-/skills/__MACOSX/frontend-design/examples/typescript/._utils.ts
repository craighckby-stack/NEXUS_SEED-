// utils.ts
/**
 * Utility functions for frontend design.
 */

/**
 * Checks if a value is null or undefined.
 *
 * @param value The value to check.
 * @returns True if the value is null or undefined, false otherwise.
 */
const isNil = (value: unknown): value is null | undefined => value === null || value === undefined;

/**
 * Checks if a value is a string.
 *
 * @param value The value to check.
 * @returns True if the value is a string, false otherwise.
 */
const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Checks if a value is an object.
 *
 * @param value The value to check.
 * @returns True if the value is an object, false otherwise.
 */
const isObject = (value: unknown): value is object => typeof value === 'object' && !isNil(value);

/**
 * Merges two objects into one.
 *
 * @param target The target object.
 * @param source The source object.
 * @returns The merged object.
 */
const mergeObjects = <T, U>(target: T, source: U): T & U => ({ ...target, ...source });

/**
 * Removes a property from an object.
 *
 * @param object The object to remove the property from.
 * @param property The property to remove.
 * @returns The object with the property removed.
 */
const removeProperty = <T, K extends keyof T>(object: T, property: K): Omit<T, K> => {
  const { [property]: _, ...rest } = object;
  return rest;
};

export { isNil, isString, isObject, mergeObjects, removeProperty };