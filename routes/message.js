'use strict'

var express = require('express');
var MessageController = require('../controllers/message');
var md_auth = require('../middlewares/authenticated');
var api = express.Router();

api.post('/message',md_auth.ensureAuth,MessageController.saveMessage);
api.get('/receiver-messages',md_auth.ensureAuth,MessageController.getReceiverMessage);
api.get('/emiter-messages',md_auth.ensureAuth,MessageController.getEmiterMessage);
api.get('/unviewed',md_auth.ensureAuth,MessageController.getUnViewedMessage);
api.get('/viewed',md_auth.ensureAuth,MessageController.setViewedMensage);
api.get('/chats',md_auth.ensureAuth,MessageController.getChats);
api.get('/messages/:id',md_auth.ensureAuth,MessageController.getMessages);

module.exports = api;