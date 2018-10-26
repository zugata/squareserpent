let nextId = 1;

/**
 * Returns an ID for the given React component instance, generating a unique
 * one if an "id" prop was not provided.
 */
export default function getUniqueId(componentInstance) {
  const {props: {id}} = componentInstance;
  if (id) {
    return id;
  }

  const uniqueId = componentInstance.__uniqueId || (componentInstance.__uniqueId = nextId++);
  return `getUniqueId__${uniqueId}`;
}
