import React from 'react';

const Codemirror = __CLIENT__ ? require('react-codemirror') : null;

if (__CLIENT__) {
  require('codemirror/lib/codemirror.css');
}

/**
 * Props:
 * - id: string. Required. Used to link styles together.
 * - code
 * - style
 * - onCodeChange
 */
export default class Editor extends React.Component {
    static defaultProps = {
      className: '',
    }

    constructor(props) {
      super(props);
      this.state = { showEditor: false };
    }

    componentDidMount() {
      this.setState({ showEditor: true });
    }

    render() {
      const {code, style, className, onCodeChange} = this.props;

      const options = {
        lineNumbers: true
      };

      // TODO: sizing the editor to the container element means that things outside
      // of the control of this component could change the editor size. CodeMirror
      // needs to be notified if anything other than a window resize causes a change
      // in the editor size. We should provide a way for parent components to
      // notify of things that could change the size of the editor.

      return <div className={`SquareSerpent-Editor ${className}`} style={{position: 'relative', ...style}}>
        <style>{`
          .SquareSerpent-Editor .ReactCodeMirror {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
          .SquareSerpent-Editor .CodeMirror {
            height: 100%;
          }
        `}</style>
        { this.state.showEditor ?
            <Codemirror
              value={code}
              onChange={onCodeChange}
              options={options} />
            : null }
      </div>;
    }
}
