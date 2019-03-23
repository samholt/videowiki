import { httpGet, httpPost, makeCallback, httpDelete } from './Common'
import request from '../utils/requestAgent'

function fetchArticleHumanVoice({ title, wikiSource, language }) {
  const url = `/api/humanvoice/audios?title=${encodeURIComponent(title)}&wikiSource=${wikiSource}&language=${language}`;

  return httpGet(url)
  .then((res) => ({ humanvoice: res.body.humanvoice }))
  .catch((reason) => { throw { error: 'FAILED', reason } })
}

function uploadSlideAudio({ title, wikiSource, language, slideNumber, blob }) {
  const url = `/api/humanvoice/audios`;

  return request.post(url)
  .field('title', title)
  .field('wikiSource', wikiSource)
  .field('position', slideNumber)
  .field('language', language)
  .field('file', blob)
  .then((res) => {
    console.log('res', res);
    return {
      slideAudioInfo: res.body.slideAudioInfo,
      humanvoice: res.body.humanvoice,
    }
  })
  .catch((reason) => { throw { error: 'FAILED', reason } })
}

function deleteCustomAudio({ title, wikiSource, language, slideNumber }) {
  const url = `/api/humanvoice/audios`;
  const data = {
    title,
    wikiSource,
    language,
    position: slideNumber,
  }

  return httpDelete(url, data)
  .then((res) => ({
    deletedAudio: res.body.deletedAudio,
  }))
  .catch((reason) => { throw { error: 'FAILED', reason } })
}

export default {
  uploadSlideAudio,
  fetchArticleHumanVoice,
  deleteCustomAudio,
}
