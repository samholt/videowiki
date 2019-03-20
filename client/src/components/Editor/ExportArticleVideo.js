import React, {
  PropTypes,
} from 'react';

import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import { Icon, Popup, Dropdown, Modal, Button, Checkbox, Input } from 'semantic-ui-react';
import UploadFileInfoModal from '../common/UploadFileInfoModal';
import { othersworkLicenceOptions } from '../common/licenceOptions';
import { NotificationManager } from 'react-notifications';

import AuthModal from '../common/AuthModal';
import fileUtils from '../../utils/fileUtils';

import videosActions from '../../actions/VideoActionCreators';
import wikiActions from '../../actions/WikiActionCreators';
import AddHumanVoiceModal from './modals/AddHumanVoiceModal';

const UPLOAD_FORM_INITIAL_VALUES = {
  licence: othersworkLicenceOptions[2].value,
  licenceText: othersworkLicenceOptions[2].text,
  licenceSection: othersworkLicenceOptions[2].section,
  source: 'others',
  sourceUrl: location.href,
}

class ExportArticleVideo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      addHumanVoiceModalVisible: false,
      updating: false,
      withSubtitles: false,
      autoDownload: false,
      submitLoadingPercentage: 0,
      isLoginModalVisible: false,
      isUploadFormVisible: false,
      isAutodownloadModalVisible: false,
      addExtraUsers: false,
      extraUsers: [],
      extraUsersInput: '',
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.video.exportArticleToVideoState === 'loading' && nextProps.video.exportArticleToVideoState === 'done') {
      NotificationManager.success('Article has been queued to be converted successfully!');
      this.setState({ isUploadFormVisible: false });
      this.props.dispatch(wikiActions.clearSlideForm(this.props.articleId, 'exportvideo'));
      if (nextProps.video.video && nextProps.video.video._id) {
        setTimeout(() => {
          this.props.history.push(`/${this.props.language}/videos/progress/${nextProps.video.video._id}`);
        }, 1000);
      }
    } else if (this.props.video.exportArticleToVideoState === 'loading' && nextProps.video.exportArticleToVideoState === 'failed') {
      const error = nextProps.video.exportArticleToVideoError || 'Something went wrong, please try again later';
      NotificationManager.info(error);
      this.setState({ isUploadFormVisible: false });
      this.props.dispatch(wikiActions.clearSlideForm(this.props.articleId, 'exportvideo'));
    }
  }

  onOptionSelect(value) {
    if (value === 'history') {
      console.log('navigating to ', `/videos/history/${this.props.title}?wikiSource=${this.props.wikiSource}`)
      return this.props.history.push(`/${this.props.language}/videos/history/${this.props.title}?wikiSource=${this.props.wikiSource}`);
    } else if (value === 'export' && !this.props.authenticated) {
      this.setState({ isLoginModalVisible: true })
    } else if (value === 'export' && this.props.authenticated) {
      if (this.props.isExportable) {
        this.setState({ isUploadFormVisible: true });
        // this.setState({ isAutodownloadModalVisible: true });
      } else {
        NotificationManager.info('Only custom articles and articles with less than 50 slides can be exported.');
      }
    } else if (value === 'download') {
      console.log('download the video ', this.props.articleVideo)
      fileUtils.downloadFile(this.props.articleVideo.video.url);
    }
  }

  onExportFormSubmit(formValues) {
    const { articleLastVideo } = this.props;
    const mode = articleLastVideo && articleLastVideo.commonsUrl && articleLastVideo.formTemplate ? 'update' : 'new';
    this.props.dispatch(videosActions.exportArticleToVideo({ ...formValues, title: this.props.title, wikiSource: this.props.wikiSource, mode }));
  }

  onExport() {
    const { title, wikiSource } = this.props;
    const { autoDownload, withSubtitles, extraUsers, addExtraUsers } = this.state;

    const exportParams = { title, wikiSource, autoDownload, withSubtitles };
    if (addExtraUsers) {
      exportParams.extraUsers = extraUsers;
    }

    this.props.dispatch(videosActions.exportArticleToVideo(exportParams));
    this.setState({ isAutodownloadModalVisible: false });
  }

  onAddExtraUser(userName) {
    const extraUsers = this.state.extraUsers;
    if (extraUsers.indexOf(userName) === -1) {
      extraUsers.push(userName);
    }
    this.setState({ extraUsers, extraUsersInput: '' });
  }

  onRemoveExtraUser(index) {
    const extraUsers = this.state.extraUsers;
    extraUsers.splice(index, 1);
    this.setState({ extraUsers })
  }

  // For the Wiki commons upload form
  // onClose() {
  //   this.setState({ open: false });
  // }

  onClose() {
    this.setState({ isAutodownloadModalVisible: false, extraUsersInput: '', extraUsers: [] })
  }

  onAddHumanVoice(language) {
    this.props.history.push(`/${this.props.language}/export/humanvoice/${this.props.title}?wikiSource=${this.props.wikiSource}&lang=${language}`);
  }

  onSkipAddHumanVoice() {
    this.setState({ addHumanVoiceModalVisible: false }, () => {
      this.onOptionSelect('export');
    });
  }

  render() {
    const { fetchArticleVideoState, articleVideo, articleLastVideo } = this.props;
    let initialFormValues = UPLOAD_FORM_INITIAL_VALUES;
    let disabledFields = [];
    let mode = 'new';

    if (articleLastVideo && articleLastVideo.commonsUrl && articleLastVideo.formTemplate) {
      const { form } = articleLastVideo.formTemplate;

      initialFormValues = {
        ...form,
        title: form.fileTitle,
        categories: form.categories.map((title) => ({ title })),
        extraUsersInput: '',
        autoDownload: false,
        addExtraUsers: false,
        extraUsers: [],
      };
      disabledFields = ['title'];
      mode = 'update';
    }

    const options = [
      {
        text: (
          <p onClick={() => this.onOptionSelect('history')}>
            Export History
          </p>
        ),
        value: 'history',
      },
    ];
    if (fetchArticleVideoState === 'done' && articleVideo) {
      if (articleVideo.exported && articleVideo.video && (articleVideo.video.commonsUploadUrl || articleVideo.video.commonsUrl || articleVideo.video.url)) {
        options.push({
          text: (
            <a href={articleVideo.video.commonsUrl ? `${articleVideo.video.commonsUploadUrl || articleVideo.video.commonsUrl}?download` : articleVideo.video.url} target="_blank" >
              Download video
            </a>
          ),
          value: 'export',
        })
      } else if (!articleVideo.exported) {
        options.push({
          text: (
            <p onClick={() => this.setState({ addHumanVoiceModalVisible: true })} >
              Export Video
            </p>
          ),
          value: 'export',
        })
      }
    }

    return (
      <a onClick={() => this.setState({ open: true })} className="c-editor__footer-wiki c-editor__footer-sidebar c-editor__toolbar-publish c-app-footer__link " >
        <Dropdown
          className="import-dropdown export-video-dropdown"
          inline
          compact
          direction="left"
          onChange={this.onOptionSelect.bind(this)}
          options={options}
          icon={
            <Popup
              position="top right"
              trigger={
                <Icon inverted color="grey" name="video" />
              }
              content={
                <p>Export Video</p>
              }
            />
          }
        />

        <AddHumanVoiceModal
          open={this.state.addHumanVoiceModalVisible}
          onClose={() => this.setState({ addHumanVoiceModalVisible: false })}
          onSkip={() => this.onSkipAddHumanVoice()}
          onSubmit={(val) => this.onAddHumanVoice(val)}
        />
        <AuthModal
          open={this.state.isLoginModalVisible}
          heading="Only logged in users can export videos to Commons"
          onClose={() => this.setState({ isLoginModalVisible: false })}
        />

        {this.state.isAutodownloadModalVisible && (
          <Modal size="small" open={this.state.isAutodownloadModalVisible} onClose={() => this.onClose()} style={{ marginTop: 0 }} >
            <Modal.Header>Export "{this.props.title.split('_').join(' ')}" to video</Modal.Header>
            <Modal.Content>
              <Modal.Description>
                <div>
                  <Checkbox
                    label="Auto download the video after it's exported"
                    checked={this.state.autoDownload}
                    onChange={(e, { checked }) => this.setState({ autoDownload: checked })}
                  />
                </div>
                <br />
                <div>
                  <Checkbox
                    label="Add more user's credits"
                    checked={this.state.addExtraUsers}
                    onChange={(e, { checked }) => this.setState({ addExtraUsers: checked, extraUsersInput: checked ? this.state.extraUsersInput : '' })}
                  />
                </div>
                {this.state.addExtraUsers && (
                  <div style={{ paddingLeft: 20, width: '50%' }}>
                    <br />
                    <ul>
                      {this.state.extraUsers.map((user, index) => (
                        <li key={`extrauser-${user}`} style={{ margin: 20, marginTop: 0, position: 'relative' }}>
                          {user} <Icon name="close" style={{ cursor: 'pointer', position: 'absolute', right: 0 }} onClick={() => this.onRemoveExtraUser(index)} />
                        </li>
                      ))}
                    </ul>
                    <Input
                      action={<Button primary disabled={!this.state.extraUsersInput.trim()} onClick={() => this.onAddExtraUser(this.state.extraUsersInput.trim())} >Add</Button>}
                      placeholder="User's name"
                      value={this.state.extraUsersInput}
                      onChange={(e) => this.setState({ extraUsersInput: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          this.onAddExtraUser(this.state.extraUsersInput.trim());
                        }
                      }}
                    />
                  </div>
                )}
              </Modal.Description>
            </Modal.Content>
            <Modal.Actions>
              <div>
                <Button onClick={() => this.onClose()}>Cancel</Button>
                <Button primary onClick={() => this.onExport()} >
                  Export
                </Button>
              </div>
            </Modal.Actions>
          </Modal>
        )}
        {this.state.isUploadFormVisible && (
          <UploadFileInfoModal
            standalone
            withSubtitles
            subTitle={`Upload exported video for ${this.props.title}`}
            initialFormValues={initialFormValues}
            disabledFields={disabledFields}
            showExtraUsers
            showAutoDownload
            mode={mode}
            articleId={this.props.articleId}
            currentSlideIndex="exportvideo"
            uploadMessage="Hold on tight!"
            title={this.props.title}
            wikiSource={this.props.wikiSource}
            visible={this.state.isUploadFormVisible}
            onClose={() => this.setState({ isUploadFormVisible: false })}
            onSubmit={this.onExportFormSubmit.bind(this)}
          />
        )}
      </a>
    )
  }
}

ExportArticleVideo.propTypes = {
  title: PropTypes.string.isRequired,
  wikiSource: PropTypes.string.isRequired,
  authenticated: PropTypes.bool,
  isExportable: PropTypes.bool.isRequired,
  history: PropTypes.object.isRequired,
  articleId: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
  video: PropTypes.object.isRequired,
  articleVideo: PropTypes.object,
  articleLastVideo: PropTypes.object,
  fetchArticleVideoState: PropTypes.string,
  language: PropTypes.string.isRequired,
}

ExportArticleVideo.defaultProps = {
  authenticated: false,
  fetchArticleVideoState: '',
  articleVideo: {
    video: {},
    exported: false,
  },
}

const mapStateToProps = ({ video, ui }) => Object.assign({}, { video, language: ui.language })

export default connect(mapStateToProps)(withRouter(ExportArticleVideo));
