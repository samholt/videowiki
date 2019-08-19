import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Progress } from 'semantic-ui-react';
import { NotificationManager } from 'react-notifications';
import StateRenderer from '../../components/common/StateRenderer';
import ProgressArrows from './ProgressArrows';

import fileUtils from '../../utils/fileUtils';
import videoActions from '../../actions/VideoActionCreators';

class VideoConvertProgress extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadProgress: 0,
      popupNotificationShown: false,
    }

    // this._startUploadProgressPoller = this._startUploadProgressPoller.bind(this);
    // this._stopUploadProgressPoller = this._stopUploadProgressPoller.bind(this);
  }
  componentWillMount () {
    const { match, dispatch } = this.props
    const { id } = match.params;
    dispatch(videoActions.clearVideo());
    dispatch(videoActions.fetchVideo({ id }))
    this._startPoller()
  }

  componentWillUnmount () {
    this._stopPoller()
    // this._stopUploadProgressPoller();
  }

  componentWillReceiveProps (nextProps) {
    // if (nextProps.conversionPercentage.converted === true) {
    //   this._stopPoller()
    //   this._navigateToHistory()
    // }
    const { videoConvertProgress } = nextProps;
    if (videoConvertProgress.video) {
      if (['failed', 'uploaded'].indexOf(videoConvertProgress.video.status) > -1 && this._sessionPoller) {
        this._stopPoller();
      }
      if (['failed', 'uploaded'].indexOf(videoConvertProgress.video.status) === -1 && !this._sessionPoller) {
        this._startPoller();
      }
      // if (videoConvertProgress.video.status === 'converted') {
      //   this._startUploadProgressPoller();
      // }
      if (videoConvertProgress.video.autoDownload && !this.state.popupNotificationShown) {
        NotificationManager.info('Your browser might block download popup. you can enable popups from Videowiki by clicking on the block icon when it does or download the video manually from the history page', '', 15000);
        this.setState({ popupNotificationShown: true });
      }
      if (videoConvertProgress.video.status === 'uploaded') {
        // this._stopUploadProgressPoller();
        // TODO Check for the user id is the same as the current user
        if (this.props.videoConvertProgress.video.status !== 'uploaded' && videoConvertProgress.video.autoDownload) {
          const downloadLink = videoConvertProgress.video.commonsUrl ? `${videoConvertProgress.video.commonsUrl}?download` : videoConvertProgress.video.url;
          fileUtils.downloadFile(downloadLink);
          // window.location.assign(videoConvertProgress.video.commonsUrl || videoConvertProgress.video.url)
          this.setState({ uploadProgress: 100 });
          setTimeout(() => {
            this._navigateToHistory();
          }, 3000);
        } else {
          this.setState({ uploadProgress: 100 });
          this._navigateToHistory();
        }
      }
    }
  }

  _startPoller () {
    if (!this._sessionPoller) {
      this._sessionPoller = setInterval(() => {
        const { match, dispatch } = this.props
        const { id } = match.params

        dispatch(videoActions.fetchVideo({ id }))
      }, 5000)
    }
  }

  _stopPoller () {
    if (this._sessionPoller) {
      clearInterval(this._sessionPoller)
      this._sessionPoller = null
    }
  }

  // _startUploadProgressPoller() {
  //   this._uploadProgressPoller = setInterval(() => {
  //     this.setState((state) => ({ uploadProgress: state.uploadProgress < 90 ? state.uploadProgress + 10 : 90 }))
  //   }, 2000)
  // }

  // _stopUploadProgressPoller() {
  //   if (this._uploadProgressPoller) {
  //     clearInterval(this._uploadProgressPoller);
  //     this._uploadProgressPoller = null;
  //   }
  // }

  _navigateToHistory () {
    this._stopPoller();
    setTimeout(() => {
      const { title, wikiSource } = this.props.videoConvertProgress.video;
      this.props.history.push(`/${this.props.language}/videos/history/${title}?wikiSource=${wikiSource}`);
      // Clear the video upload status
      this.props.dispatch(videoActions.clearVideo());
    }, 2000)
  }

  _render () {
    const { videoConvertProgress } = this.props;
    if (!videoConvertProgress.video) return <div>loading...</div>;

    const title = videoConvertProgress.video ? videoConvertProgress.video.title : '';
    const status = videoConvertProgress.video ? videoConvertProgress.video.status : '';
    let progress = 0;
    // check for the latest available progress percentage
    if (videoConvertProgress.video.wrapupVideoProgress) {
      progress = videoConvertProgress.video.wrapupVideoProgress;
    } else if (videoConvertProgress.video.combiningVideosProgress) {
      progress = videoConvertProgress.video.combiningVideosProgress;
    } else if (videoConvertProgress.video.textReferencesProgress) {
      progress = videoConvertProgress.video.textReferencesProgress;
    } else {
      progress = videoConvertProgress.video.conversionProgress;
    }

    progress = Math.floor(progress);

    return (
      <div className="u-page-center" style={{ marginTop: '7em' }}>
        {title && status !== 'failed' && (
          <h2>{ `Exporting Videowiki Article for ${title.split('_').join(' ')} to Video` }</h2>
        )}
        {status === 'failed' && (
          <h2>
            Something went wrong while exporting the article. please try again
            <br /><br />
            <Link to={`/videowiki/${videoConvertProgress.video.title}?wikiSource=${videoConvertProgress.video.wikiSource}`}>Back to article</Link>
          </h2>
        )}
        {status !== 'failed' && (
          <Progress className="c-app-conversion-progress" percent={progress} progress indicating />
        )}
        {status !== 'failed' && (
          <ProgressArrows
          stage1={videoConvertProgress.video.conversionProgress}
          stage2={videoConvertProgress.video.textReferencesProgress}
          stage3={videoConvertProgress.video.combiningVideosProgress}
          stage4={videoConvertProgress.video.wrapupVideoProgress}
          />
        )}
        <div>
          {status === 'queued' && (
            <span>Your video is currently queued to be exported. please wait</span>
          )}
          {/* {status === 'progress' && (
            <span>{`Exporting - ${progress}% exported`}</span>
          )} */}
          {status === 'converted' && (
            <span>Exported Successfully! Uploading to Commons...</span>
          )}
          {status === 'uploaded' && (
            <span>Uploaded Successfully!</span>
          )}
        </div>
        {status === 'converted' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }} >
            <Progress style={{ width: 500, marginLeft: '-1rem' }} percent={this.state.uploadProgress} progress indicating />
          </div>
        )}
        {/* {['failed', 'converted', 'uploaded'].indexOf(status) === -1 && (
          <div>
            <strong>Quick Fact: </strong>
            It takes 8-10 minutes to export an article. So get some <img className="c-app-coffee" src="https://s3.eu-central-1.amazonaws.com/vwpmedia/statics/coffee.png" /> <img className="c-app-coffee" src="https://s3.eu-central-1.amazonaws.com/vwpmedia/statics/coffee.png" /> until then.
          </div>
        )} */}

      </div>
    )
  }

  render () {
    // const { videoConvertProgress } = this.props;
    return this._render();
  }
}

VideoConvertProgress.propTypes = {
  dispatch: PropTypes.func.isRequired,
  match: PropTypes.object,
  videoConvertProgress: PropTypes.object.isRequired,
  history: React.PropTypes.shape({
    push: React.PropTypes.func.isRequired,
  }).isRequired,
  language: PropTypes.string.isRequired,
}

const mapStateToProps = ({ video, ui }) =>
  Object.assign({}, { videoConvertProgress: video.videoConvertProgress, language: ui.language })

export default connect(mapStateToProps)(VideoConvertProgress);
