import React from 'react';
import Dropdown from './controls/Dropdown';
import HandlebarsRenderer from '../renderers/HandlebarsRenderer';
import TemplateEngine from '../models/TemplateEngine';
import * as templateApi from '../../client/api/templateApi';
import * as sampleDataApi from '../../client/api/sampleDataApi';

function setFrameHTML(frameElement, html) {
  const doc = frameElement.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();
}

function previewPropsHaveSameTemplate(props1, props2) {
  return props1.projectName === props2.projectName
    && (!props1.template ? !props2.template
        : !props2.template ? false
        : props1.template.name === props2.template.name);
}

function previewPropsHaveSameCode(props1, props2) {
  return !props1.template ? !props2.template
    : !props2.template ? false
    : props1.template.content === props2.template.content;
}

/**
 * Props:
 * - projectName
 * - template: Template instance
 */
export default class Preview extends React.Component {
  static defaultProps = {
    className: '',
  }

  constructor(props) {
    super(props);

    this.state = {};

    // REVIEW: where should this "registry" live on the client
    this.templateRenderersByEngineName = {
      handlebars: new HandlebarsRenderer()
    };

    this._frameElem = null;

    this._lastTemplateRendering = '';
    this._templateRenderingInProgress = false;

    // Passed to the Renderer and re-used as long as we remain on the same
    // template. See AbstractRenderer.renderTemplate.
    this._compiledTemplateCache = {};

    // Like compiledTemplateCache, cached until the template changes
    this._cachedTemplateList = null;
    this._sampleDataCache = {};

    // Flags if a template render should be initiated when the previous finishes
    this._templateRenderPending = false;
  }

  getCurrentSampleDataName(props = this.props) {
    if (this.state.inputSampleDataName !== undefined) {
      return this.state.inputSampleDataName;
    } else {
      const {sampleDataNames} = props;
      return sampleDataNames && sampleDataNames[0] || null;
    }
  }

  setFrameElem(elem) {
    this._frameElem = elem;
    if (elem) {
      setFrameHTML(elem, this._lastTemplateRendering);
    }
  }

  scheduleTemplateRendering(props = this.props) {
    if (this._templateRenderingInProgress) {
      this._templateRenderPending = true;
      return;
    }

    this._templateRenderPending = false;

    const {projectName, template} = props;
    const sampleDataName = this.getCurrentSampleDataName(props);

    if (!(template && template.name && template.engineName)) {
      this._lastTemplateRendering = '';
      return;
    }

    const renderer = this.templateRenderersByEngineName[template.engineName];

    if (!renderer) {
      this._lastTemplateRendering = '';
      console.error(`No renderer configured for template engine "${template.engineName}"`);
      return;
    }

    const finish = (html) => {
      if (this._frameElem) {
        setFrameHTML(this._frameElem, html);
      }

      this._lastTemplateRendering = html;
      this._templateRenderingInProgress = false;

      if (this._templateRenderPending) {
        this.scheduleTemplateRendering();
      }
    };

    Promise.all([
      this._cachedTemplateList || templateApi.list({ projectName }),

      sampleDataName ?
        this._sampleDataCache[sampleDataName] ||
          sampleDataApi.load({
            projectName,
            templateName: template.name,
            name: sampleDataName,
            format: 'json'
          })
      : {}
    ])
    .then(([
        templates,
        sampleData
    ]) => {
      // REVIEW: the caches are set asynchronously... this could lead to caches set
      // from old calls
      this._cachedTemplateList = templates;
      this._sampleDataCache[sampleDataName] = sampleData;

      return renderer.renderTemplate({
        template,

        templateList: _(templates)
          .filter(({engineName}) => engineName === template.engineName)
          .map(({name}) => name)
          .value(),

        loader: name => templateApi.load({
          projectName,
          templateFilePath: name + TemplateEngine.wrap(template.engineName).fileExtension,
          state: 'published',
        }),

        data: sampleData,
        compiledTemplateCache: this._compiledTemplateCache
      });
    })
    .then(({body}) => {
      finish(body);
    })
    .catch(e => {
      finish('');
      return Promise.reject(e);
    });

    this._templateRenderingInProgress = true;
  }

  componentDidMount() {
    this.scheduleTemplateRendering();
  }

  componentWillReceiveProps(newProps) {
    if (!previewPropsHaveSameTemplate(newProps, this.props)) {
      // Clear caches and schedule a re-render
      this._compiledTemplateCache = {};
      this._cachedTemplateList = null;
      this._sampleDataCache = {};

      this.scheduleTemplateRendering(newProps);

    } else if (
        !previewPropsHaveSameCode(newProps, this.props)
        || !_.isEqual(newProps.sampleDataNames, this.props.sampleDataNames)) {
      this.scheduleTemplateRendering(newProps);
    }
  }

  handleSampleDataChange(inputSampleDataName) {
    this.setState({ inputSampleDataName }, () => {
      this.scheduleTemplateRendering();
    });
  }

  render() {
    const {className, style, sampleDataNames} = this.props;

    return (
      <div className={className} style={{display: 'flex', flexDirection: 'column', ...style}}>
        {sampleDataNames.length > 0 ?
          <Dropdown
              style={{flex: 'none'}}
              fieldStyle={{
                padding: 0
              }}
              inputStyle={{
                boxSizing: 'border-box',
                borderBottom: '0 none',
                borderRight: '1px solid #e0e0e0',
                padding: 6,
              }}
              iconStyle={{
                paddingRight: 2
              }}
              value={this.getCurrentSampleDataName()}
              options={sampleDataNames.map(name => ({value: name}))}
              onChange={v => this.handleSampleDataChange(v)} />
          : null}

        <div style={{
            flex: 'auto',
            position: 'relative',
            borderTop: sampleDataNames.length > 0 ? '1px solid #e0e0e0' : '0 none',
        }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
            frameBorder="0"
            ref={elem => this.setFrameElem(elem)} />
        </div>

      </div>
    );
  }
}
