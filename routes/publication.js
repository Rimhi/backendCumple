'use strict'


var express = require('express');
var PublicationController = require('../controllers/publication');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');
var multiparty = require('connect-multiparty');
var md_upload = multiparty({uploadDir:'./uploads/publications'});

api.post('/publication',md_auth.ensureAuth,PublicationController.savePublication);
api.get('/publications/:page?',md_auth.ensureAuth,PublicationController.getPublications);
api.get('/publication/:id',md_auth.ensureAuth,PublicationController.getPublication);
api.delete('/delete-publication/:id',md_auth.ensureAuth,PublicationController.deletePublication);
api.get('/mypublications/:id/:page?',md_auth.ensureAuth,PublicationController.getPublicationsUser);
api.post('/upload-image-publication/:id',[md_upload,md_auth.ensureAuth],PublicationController.uploadImage);
api.get('/get-image-publication/:imageFile',md_auth.ensureAuth,PublicationController.getImageFile);
module.exports = api;