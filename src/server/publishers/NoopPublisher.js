import AbstractPublisher from './AbstractPublisher';

/**
 * A publisher that does nothing. Useful in scenarios where a publisher is
 * redundant, for example, if the published templates are used directly from
 * where they're stored.
 */
export default class NoopPublisher extends AbstractPublisher {
  publish({template, templateList, loader, variableNames}) {
    console.log('NoopPublisher: called on', template.name);
  }
}
