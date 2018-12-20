import express from 'express';
import Article from '../../models/Article';
import VideoModel from '../../models/Video';
import UploadFormTemplateModel from '../../models/UploadFormTemplate';
import { convertArticle } from '../../controllers/converter';
import { saveTemplate } from '../../middlewares/saveTemplate';

const router = express.Router()

module.exports = () => {
  // ================ convert article to video
  router.post('/convert', isAuthenticated, saveTemplate, (req, res) => {
    // PROD
    const {
      fileTitle,
      description,
      categories,
      licence,
      source,
      sourceUrl,
      date,
      title,
      wikiSource,
    } = req.body;

    const errors = []

    if (!fileTitle) {
      errors.push('File title is required')
    }
    if (!description) {
      errors.push('Description is required')
    }
    if (!categories || categories.length === 0) {
      errors.push('At least one category is required')
    }
    if (!source) {
      errors.push('Source field is required')
    }
    if (!date) {
      errors.push('Date field is required')
    }
    if (!licence) {
      errors.push('Licence field is required')
    }
    if (source && source === 'others' && !sourceUrl) {
      errors.push('Please specify the source of the file')
    }

    if (!title || !wikiSource) {
      return errors.push('Title and wiki source are required fields');
    }

    if (errors.length > 0) {
      console.log(errors)
      return res.status(400).send(errors.join(', '))
    }

    Article.findOne({ title, wikiSource, published: true }, (err, article) => {
      if (err) {
        return res.status(400).send('Something went wrong');
      }
      if (!article) {
        return res.status(400).send('Invalid article title or wiki source');
      }

      // Create a form template

      UploadFormTemplateModel.create({
        title,
        wikiSource,
        published: false,
        user: req.user._id,
        form: req.body,
      }, (err, formTemplate) => {
        if (err) {
          console.log('error creating form template', err);
          return res.status(400).send('Something went wrong, please try again');
        }

        VideoModel.create({ title, wikiSource, formTemplate: formTemplate._id, user: req.user._id }, (err, video) => {
          if (err) {
            console.log('error creating new video', err);
            return res.status(400).send('something went wrong');
          }

          console.log('video is ', video)
          convertArticle({ videoId: video._id });
          return res.send('Article has been queued to be converted successfully!');
        })
      })
    })
  })
  return router
}

const isAuthenticated = (req, res, next) => {
  // if user is authenticated in the session, call the next() to call the next request handler
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated()) {
    return next()
  }
  // if the user is not authenticated then redirect him to the login page
  res.send(401, 'Unauthorized!')
}
