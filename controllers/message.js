'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Message = require('../models/message');
var Chat = require('../models/chat');
var Follow = require('../models/follow');

function saveMessage(req,res){
	var params = req.body;
	if(!params.text){
			return res.status(200).send({message:'Ups! falta algo en tu mensaje'});
	}
	if(params.chat){
		
		var message = new Message();
		message.emiter = req.user.sub;
		message.receiver = params.receiver;
		message.text = params.text;
		message.created_at = moment().unix();
		message.viewed = 'false';
		message.chat = params.chat;

		message.save((err,messageStored)=>{
			if(err) return res.status(500).send({message:'Ups! falta algo en tu mensaje'});
			if(!messageStored)  return res.status(404).send({message:'Ups! tu mensaje no se ha enviado'});
			return res.status(200).send({message:'Enviado',message:messageStored});
		});
	}else{
		Chat.findOne({ $or: [ { $and: [ {emiter: req.user.sub},{receiver: params.receiver}] },
			{ $and: [ {emiter: params.receiver},
			{receiver: req.user.sub} ]}]}).exec((err,chat)=>{
					if(err) return res.status(500).send({message:'Ups! falta algo en tu mensaje'});	
					if(!chat){
							var chat = new Chat();
							chat.created_at = moment().unix();
							chat.emiter = req.user.sub;
							chat.receiver = params.receiver;
							chat.save((err,chatStored)=>{
							if(err) return res.status(500).send({message:'Ups! falta algo en tu mensaje'});
							var message = new Message();
							message.text = params.text;
							message.viewed = 'false';
							message.chat = chatStored._id;
							message.created_at = moment().unix();
							message.receiver = params.receiver;
							message.emiter = req.user.sub;
							message.save((err,messageStored)=>{
								if(err) return res.status(500).send({message:'Ups! falta algo en tu mensaje'});
								if(!messageStored)  return res.status(404).send({message:'Ups! tu mensaje no se ha enviado'});
								return res.status(200).send({message:'Enviado',message:messageStored});
							});
						});
					}else{
						var message = new Message();
							message.text = params.text;
							message.viewed = 'false';
							message.chat = chat._id;
							message.created_at = moment().unix();
							message.save((err,messageStored)=>{
								if(err) return res.status(500).send({message:'Ups! falta algo en tu mensaje'});
								if(!messageStored)  return res.status(404).send({message:'Ups! tu mensaje no se ha enviado'});
								return res.status(200).send({message:'Enviado',message:messageStored});
							});
					}
			});
		
		
		

		
	}
}

function getReceiverMessage(req,res){
	var user_id = req.user.sub;

	var page = 1;

	if(req.params.page){
		page = req.params.page;
	}
	var itemPerPage = 5;
	Message.find({receiver:user_id}).populate('emiter','name surname _id nick image').paginate(page,itemPerPage,(err,messages,total)=>{
		if(err) return res.status(500).send({message:'Ups! falta algo en tu mensajeria'});
		if(!messages) return res.status(404).send({message:'No tienes mensajes'});
		return res.status(200).send({total,pages:Math.ceil(total/itemPerPage),messages,page});
	});
}
function getEmiterMessage(req,res){
	var user_id = req.user.sub;

	var page = 1;

	if(req.params.page){
		page = req.params.page;
	}
	var itemPerPage = 5;
	Message.find({emiter:user_id}).populate('receiver emiter','name surname _id nick image').paginate(page,itemPerPage,(err,messages,total)=>{
		if(err) return res.status(500).send({message:'Ups! falta algo en tu mensajeria'});
		if(!messages) return res.status(404).send({message:'No tienes mensajes'});
		return res.status(200).send({total,pages:Math.ceil(total/itemPerPage),messages,page});
	});
}

function getUnViewedMessage(req,res){
	var user_id = req.user.sub;

	Message.countDocuments({receiver:user_id,viewed:'false'}).exec((err,messages)=>{
		if(err) return res.status(500).send({message:'Ups! falta algo en tu mensajeria'});
		if(!messages) return res.status(404).send({message:'No tienes mensajes'});
		return res.status(200).send({messages,message:'sin leer'});
	});
}

function setViewedMensage(req,res){
	var user_id = req.user.sub;
	Message.update({receiver:user_id,viewed:'false'},{viewed:'true'},{'multi':true},(err,messages)=>{
		if(err) return res.status(500).send({message:'Ups! falta algo en tu mensajeria'});
		if(!messages) return res.status(404).send({message:'No tienes mensajes'});
		return res.status(200).send({messages,message:'leidos'});
	});
}
function getChats(req,res){
	Chat.find({ $or: [{emiter: req.user.sub},{receiver: req.user.sub}]}).populate('receiver emiter').exec((err,chats)=>{
		if(err) return res.status(500).send({message:'Ups! falta algo en tu mensajeria'});
		if(!chats) return res.status(404).send({message:'no tienes chats'});

		return res.status(200).send({message:'tus chats',chats});
	});
}
function getMessages(req,res){
	var id = req.params.id
		Message.find({chat:id}).populate('receiver emiter').exec((err,messages)=>{
			if(err) return res.status(500).send({message:'Ups! falta algo en tu mensajeria'});

			return res.status(200).send({message:'tus chats',messages});
		});
}


module.exports = {
	saveMessage,
	getReceiverMessage,
	getEmiterMessage,
	getUnViewedMessage,
	setViewedMensage,
	getChats,
	getMessages
}