import _ from 'lodash';

/**
 * Little utility for updating a React component's state as props change. Can
 * eventually be substituted for your data fetching/synchronization framework
 * of choice.
 *
 * An instance should be constructed as described in the constructor docs,
 * then `willMount` should be called when the component is mounting, and
 * `willReceiveProps` should be called in `componentWillReceiveProps` with
 * the new props.
 */
export default class StateUpdater {
  /**
   * Takes the component whose state to manage and a "map" of configuration
   * objects, each specifying a state update scenario. Each one should have
   * the following properties:
   *
   * - arePropsEqual(props1, props2): a function that takes two `props`
   * 		objects and returns a bool indicating if, for the purposes of this
   * 		update scenario, the props are equivalent
   * - getNewState(props): will be called initially or when props change (as
   * 		determined by `arePropsEqual`). Should take the new (or initial) props
   * 		and return an object, or a promise for an object, that will be passed
   * 		to `setState`.
   *
   * The key for each update scenario can be used to eagerly trigger an update
   * with the `refresh` method.
   *
   * For example:
   *
   * 		new StateUpdater(this, {
   *   		foo: {
   *     		arePropsEqual: (p1, p2) => p1.name === p2.name,
   *     		getNewState: ({name}) => fetch(`foo/${name}`)
   *     			.then(r => r.json())
   *     			.then(({value1}) => ({state1: value1}))
   *   		}
   * 		})
   */
  constructor(component, updateSpecs) {
    this.component = component;
    this.updateSpecs = updateSpecs;
  }

  /**
   * Should be called when the component is mounting. Does the initial fetch
   * for state values.
   */
  willMount() {
    this.refresh();
  }

  /**
   * Should be called in `componentWillReceiveProps` with the new props.
   * Performs a refetch of any update scenarios that think they've changed.
   */
  willReceiveProps(newProps) {
    _.each(this.updateSpecs, updateSpec => {
      if (!updateSpec.arePropsEqual(this.component.props, newProps)) {
        this._runUpdateSpec(updateSpec, newProps);
      }
    });
  }

  /**
   * Refreshes the named update scenario (based on the key it was given) in the
   * configuration object given to the constructor. With no arguments, refreshes
   * all update scenarios.
   */
  refresh(optName) {
    if (optName) {
      this._runUpdateSpec(this.updateSpecs[optName], this.component.props);
    } else {
      _.each(this.updateSpecs, updateSpec =>
        this._runUpdateSpec(updateSpec, this.component.props));
    }
  }

  _runUpdateSpec(updateSpec, props) {
    Promise.resolve(updateSpec.getNewState(props))
      .then(newState => {
        if (newState) {
          this.component.setState(newState);
        }
      });
  }
}
